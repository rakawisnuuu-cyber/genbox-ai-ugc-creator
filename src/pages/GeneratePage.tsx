import { useState, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ImagePlus,
  Upload,
  X,
  Loader2,
  ChevronDown,
  Camera,
  Smartphone,
  CameraIcon,
  RefreshCw,
  ArrowUpRight,
  Film,
  Download,
  Save,
  Expand,
  Plus,
  Check,
  Zap,
  Gem,
  Megaphone,
  Grid3X3,
  Aperture,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useApiKeys } from "@/hooks/useApiKeys";
import { usePromptModel } from "@/hooks/usePromptModel";
import { useCustomCharacters } from "@/hooks/useCustomCharacters";
import { useUpscale } from "@/hooks/useUpscale";
import { useImageGeneration, type ImageProgress } from "@/hooks/useImageGeneration";
import { PRESETS } from "@/lib/character-presets";
import type { CharacterData } from "@/components/CharacterCard";
import {
  CONTENT_TEMPLATES,
  type ContentTemplateKey,
  isRecommendedForCategory,
} from "@/lib/content-templates";
import { getEnvironments, type RichOption } from "@/lib/category-options";
import {
  detectProductDNA,
  type ProductDNA,
  type ProductCategory,
  ALL_CATEGORIES,
} from "@/lib/product-dna";
import { getStoryRoleColor } from "@/lib/storyboard-angles";
import {
  planImageShots,
  estimateCost,
  formatRupiah,
  type ContentMode,
  type ImageModel,
  type RealismLevel,
  type ImageShotPlan,
  type GenerationConfig,
} from "@/lib/image-generation-engine";
import { supabase } from "@/integrations/supabase/client";
import { fileToBase64 } from "@/lib/image-utils";
import { generateVideoAndWait, type VideoModel } from "@/lib/kie-video-generation";
import { getMotionPrompt, type VideoModelType } from "@/lib/image-to-video-prompts";

// ── Icon map for templates ──────────────────────────────────────
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Gem, Megaphone, Grid3X3, Aperture, Zap,
};

// ── Cost per image model ────────────────────────────────────────
const MODEL_INFO: Record<ImageModel, { label: string; cost: number; desc: string }> = {
  "nano-banana": { label: "Nano Banana (Cepat)", cost: 310, desc: "~Rp 310/gambar" },
  "nano-banana-2": { label: "Nano Banana 2 (Seimbang)", cost: 620, desc: "~Rp 620/gambar" },
  "nano-banana-pro": { label: "Nano Banana Pro (Terbaik)", cost: 1400, desc: "~Rp 1,400/gambar" },
};

const IMAGE_COUNTS = [3, 6, 9] as const;
const ASPECT_RATIOS = ["9:16", "1:1", "4:5", "3:4", "16:9"];
const RESOLUTIONS = ["1K", "2K", "4K"] as const;

// ── Video model cost ────────────────────────────────────────────
const VIDEO_COST: Record<string, number> = {
  grok: 1240,
  kling_std: 1860,
  kling_pro: 3560,
  veo_fast: 4960,
};

const GeneratePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { kieApiKey, geminiKey } = useApiKeys();
  const { model: promptModel } = usePromptModel();
  const { customChars } = useCustomCharacters();
  const { upscale, getState: getUpscaleState } = useUpscale();
  const imgGen = useImageGeneration();

  // ── Character state ───────────────────────────────────────────
  const allChars = useMemo(() => [...customChars, ...PRESETS], [customChars]);
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const selectedChar = useMemo(
    () => allChars.find((c) => c.id === selectedCharId) || null,
    [allChars, selectedCharId],
  );
  const [ownPhotoUrl, setOwnPhotoUrl] = useState<string | null>(null);
  const [ownPhotoUploading, setOwnPhotoUploading] = useState(false);

  // ── Product state ─────────────────────────────────────────────
  const [productUrl, setProductUrl] = useState<string | null>(null);
  const [productPreview, setProductPreview] = useState<string | null>(null);
  const [productDNA, setProductDNA] = useState<ProductDNA | null>(null);
  const [detectingDNA, setDetectingDNA] = useState(false);
  const [uploading, setUploading] = useState(false);

  // ── Content mode & template ───────────────────────────────────
  const [contentMode, setContentMode] = useState<ContentMode>("ugc");
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplateKey>("problem_solution");

  // ── Environment ───────────────────────────────────────────────
  const envOptions = useMemo(
    () => getEnvironments(productDNA?.category || "other"),
    [productDNA?.category],
  );
  const [selectedEnv, setSelectedEnv] = useState<RichOption>(envOptions[0]);

  // ── Generation settings ───────────────────────────────────────
  const [imageCount, setImageCount] = useState<3 | 6 | 9>(6);
  const [imageModel, setImageModel] = useState<ImageModel>("nano-banana-pro");
  const [resolution, setResolution] = useState<"1K" | "2K" | "4K">("2K");
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [realismLevel, setRealismLevel] = useState<RealismLevel>("standard");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // ── Shot plans (computed on generate) ─────────────────────────
  const [shotPlans, setShotPlans] = useState<ImageShotPlan[]>([]);

  // ── Video panel state ─────────────────────────────────────────
  const [videoImageIdx, setVideoImageIdx] = useState<number | null>(null);
  const [videoModel, setVideoModel] = useState<VideoModelType>("kling_std");
  const [videoDuration, setVideoDuration] = useState(6);
  const [videoPrompt, setVideoPrompt] = useState("");
  const [videoGenerating, setVideoGenerating] = useState(false);
  const [videoResult, setVideoResult] = useState<string | null>(null);

  // ── Lightbox ──────────────────────────────────────────────────
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  // ── File input refs ───────────────────────────────────────────
  const productInputRef = useRef<HTMLInputElement>(null);
  const ownPhotoInputRef = useRef<HTMLInputElement>(null);

  // ── Computed ──────────────────────────────────────────────────
  const totalCost = estimateCost(imageModel, imageCount);
  const canGenerate = !!selectedChar && !!productUrl && !!productDNA && !!kieApiKey;
  const isGenerating = imgGen.progress.status === "generating";
  const isCompleted = imgGen.progress.status === "completed";
  const completedResults = imgGen.progress.results.filter(Boolean);

  // ── Templates for current mode ────────────────────────────────
  const visibleTemplates = useMemo(() => {
    if (contentMode === "ugc") {
      return CONTENT_TEMPLATES.filter(
        (t) =>
          !["hero_product", "brand_campaign", "katalog_produk", "studio_editorial"].includes(t.key),
      );
    }
    return CONTENT_TEMPLATES.filter((t) =>
      ["hero_product", "brand_campaign", "katalog_produk", "studio_editorial"].includes(t.key),
    );
  }, [contentMode]);

  // ── Handlers ──────────────────────────────────────────────────
  const handleProductUpload = useCallback(
    async (file: File) => {
      if (!user || !geminiKey) {
        toast({ title: "API key Gemini belum di-setup", variant: "destructive" });
        return;
      }
      setUploading(true);
      setProductDNA(null);
      try {
        // Preview
        const preview = URL.createObjectURL(file);
        setProductPreview(preview);

        // Upload to Supabase
        const path = `${user.id}/${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage
          .from("product-images")
          .upload(path, file, { contentType: file.type });
        if (upErr) throw upErr;

        const { data: pubData } = supabase.storage.from("product-images").getPublicUrl(path);
        setProductUrl(pubData.publicUrl);
        setUploading(false);

        // Detect DNA
        setDetectingDNA(true);
        const base64 = await fileToBase64(file);
        const dna = await detectProductDNA(base64, promptModel, geminiKey);
        setProductDNA(dna);
        // Auto-select env
        const envs = getEnvironments(dna.category);
        setSelectedEnv(envs[0]);
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
        const { error } = await supabase.storage
          .from("character-packs")
          .upload(path, file, { contentType: file.type });
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

    const charImageUrl =
      selectedCharId === "own-photo"
        ? ownPhotoUrl || ""
        : selectedChar.hero_image_url || "";

    const config: GenerationConfig = {
      mode: contentMode,
      templateKey: selectedTemplate,
      productDNA,
      characterDescription: selectedChar.description,
      characterImageUrl: charImageUrl,
      productImageUrl: productUrl,
      environment: selectedEnv,
      imageCount,
      realismLevel,
      aspectRatio,
      imageModel,
      resolution,
    };

    const plans = planImageShots(config);
    setShotPlans(plans);

    imgGen.start({
      shots: plans,
      imageModel,
      resolution,
      aspectRatio,
      kieApiKey,
      characterImageUrl: charImageUrl,
      productImageUrl: productUrl,
    });
  }, [
    canGenerate,
    selectedChar,
    selectedCharId,
    ownPhotoUrl,
    productDNA,
    productUrl,
    contentMode,
    selectedTemplate,
    selectedEnv,
    imageCount,
    realismLevel,
    aspectRatio,
    imageModel,
    resolution,
    kieApiKey,
    imgGen,
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
      const sourceUrl = completedResults[videoImageIdx]!.imageUrl;
      const result = await generateVideoAndWait({
        model: videoModel as VideoModel,
        prompt: videoPrompt,
        imageUrls: [sourceUrl],
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
      // Auto-fill motion prompt
      if (shotPlans[idx]) {
        const beat = shotPlans[idx];
        const prompt = getMotionPrompt({
          beat: beat.storyRole.toLowerCase().replace(/\s+/g, "_"),
          model: videoModel,
          character: selectedChar?.description || "",
          product: productDNA?.product_description || "",
          productColor: productDNA?.dominant_color || "",
          productPackaging: productDNA?.packaging_type || "",
          environment: selectedEnv.description || selectedEnv.label,
        });
        setVideoPrompt(prompt);
      }
    },
    [shotPlans, videoModel, selectedChar, productDNA, selectedEnv],
  );

  // ── Drag & Drop ───────────────────────────────────────────────
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) handleProductUpload(file);
    },
    [handleProductUpload],
  );

  // ── RENDER ────────────────────────────────────────────────────
  return (
    <div className="flex flex-col lg:flex-row gap-0 -mx-4 -my-4 lg:-mx-6 lg:-my-8 min-h-[calc(100vh-48px)]">
      {/* ── LEFT PANEL: Setup ──────────────────────────────── */}
      <div className="w-full lg:w-[380px] lg:min-w-[380px] border-r border-border/40 bg-card/30 overflow-y-auto lg:h-screen flex flex-col">
        <div className="flex-1 p-4 space-y-5 pb-24">
          {/* A. Character Selection */}
          <Section label="Karakter">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {allChars.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCharId(c.id)}
                  className={`flex-shrink-0 flex flex-col items-center gap-1 group ${
                    selectedCharId === c.id ? "opacity-100" : "opacity-60 hover:opacity-80"
                  }`}
                >
                  <div
                    className={`w-[52px] h-[52px] rounded-xl overflow-hidden border-2 transition-all ${
                      selectedCharId === c.id
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-transparent"
                    }`}
                  >
                    {c.hero_image_url ? (
                      <img
                        src={c.hero_image_url}
                        alt={c.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Camera className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground truncate max-w-[52px]">
                    {c.name}
                  </span>
                </button>
              ))}
              {/* Own photo upload */}
              <button
                onClick={() => ownPhotoInputRef.current?.click()}
                className="flex-shrink-0 flex flex-col items-center gap-1"
              >
                <div
                  className={`w-[52px] h-[52px] rounded-xl border-2 border-dashed flex items-center justify-center transition-all ${
                    selectedCharId === "own-photo"
                      ? "border-primary bg-primary/5"
                      : "border-border/60 hover:border-border"
                  }`}
                >
                  {ownPhotoUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : ownPhotoUrl ? (
                    <img
                      src={ownPhotoUrl}
                      alt="Own"
                      className="w-full h-full rounded-[10px] object-cover"
                    />
                  ) : (
                    <Plus className="w-4 h-4 text-muted-foreground" />
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

          {/* B. Product Upload */}
          <Section label="Produk">
            {!productPreview ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => productInputRef.current?.click()}
                className="h-[100px] border-2 border-dashed border-border/60 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-border transition-colors"
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Drop foto produk</span>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative w-full h-[100px] rounded-xl overflow-hidden border border-border/40">
                  <img
                    src={productPreview}
                    alt="Product"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => {
                      setProductPreview(null);
                      setProductUrl(null);
                      setProductDNA(null);
                    }}
                    className="absolute top-1.5 right-1.5 bg-black/60 rounded-lg p-1 hover:bg-black/80"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  {detectingDNA && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  )}
                </div>
                {productDNA && (
                  <DNACard dna={productDNA} />
                )}
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
            <div className="grid grid-cols-2 gap-2">
              {(["ugc", "commercial"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setContentMode(mode);
                    setSelectedTemplate(mode === "ugc" ? "problem_solution" : "hero_product");
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    contentMode === mode
                      ? "border-primary/30 bg-primary/5"
                      : "border-border/40 hover:border-border/60"
                  }`}
                >
                  {mode === "ugc" ? (
                    <Smartphone className="w-4 h-4 text-primary mb-1.5" />
                  ) : (
                    <CameraIcon className="w-4 h-4 text-primary mb-1.5" />
                  )}
                  <p className="text-xs font-medium">
                    {mode === "ugc" ? "UGC / Affiliate" : "Commercial / Iklan"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {mode === "ugc"
                      ? "Imperfect, relatable, authentic"
                      : "Editorial, cinematic, controlled"}
                  </p>
                </button>
              ))}
            </div>
          </Section>

          {/* D. Gaya Konten */}
          <Section label="Gaya Konten">
            <div className="grid grid-cols-2 gap-1.5">
              {visibleTemplates.map((t) => {
                const isRec =
                  productDNA && isRecommendedForCategory(t, productDNA.category);
                return (
                  <button
                    key={t.key}
                    onClick={() => setSelectedTemplate(t.key)}
                    className={`p-2.5 rounded-lg border text-left transition-all relative ${
                      selectedTemplate === t.key
                        ? "border-primary/30 bg-primary/5"
                        : "border-border/30 hover:border-border/50"
                    }`}
                  >
                    <p className="text-[11px] font-medium">{t.label}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-1">
                      {t.desc}
                    </p>
                    {isRec && (
                      <span className="absolute top-1 right-1 text-[8px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-md font-medium">
                        Cocok
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* E. Environment */}
          <Section label="Environment">
            <Select
              value={selectedEnv.label}
              onValueChange={(val) => {
                const found = envOptions.find((e) => e.label === val);
                if (found) setSelectedEnv(found);
              }}
            >
              <SelectTrigger className="bg-background/50 border-border/40 h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {envOptions.map((e) => (
                  <SelectItem key={e.label} value={e.label}>
                    <span className="text-xs">{e.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedEnv.description && (
              <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                {selectedEnv.description}
              </p>
            )}
          </Section>

          {/* F. Image Count */}
          <Section label="Jumlah Gambar">
            <div className="flex gap-2">
              {IMAGE_COUNTS.map((n) => (
                <button
                  key={n}
                  onClick={() => setImageCount(n)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                    imageCount === n
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border/30 text-muted-foreground hover:border-border/50"
                  }`}
                >
                  {n}
                  <span className="block text-[9px] opacity-60 mt-0.5">
                    {formatRupiah(estimateCost(imageModel, n))}
                  </span>
                </button>
              ))}
            </div>
          </Section>

          {/* G. Advanced Settings */}
          <div>
            <button
              onClick={() => setAdvancedOpen(!advancedOpen)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${advancedOpen ? "rotate-180" : ""}`}
              />
              Pengaturan Lanjutan
            </button>
            {advancedOpen && (
              <div className="mt-3 space-y-3 pl-1">
                {/* Image Model */}
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">
                    Image Model
                  </label>
                  <Select
                    value={imageModel}
                    onValueChange={(v) => setImageModel(v as ImageModel)}
                  >
                    <SelectTrigger className="bg-background/50 border-border/40 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(MODEL_INFO) as [ImageModel, typeof MODEL_INFO[ImageModel]][]).map(
                        ([k, v]) => (
                          <SelectItem key={k} value={k}>
                            <span className="text-xs">{v.label}</span>
                            <span className="text-[10px] text-muted-foreground ml-2">
                              {v.desc}
                            </span>
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Resolution */}
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">
                    Resolution
                  </label>
                  <div className="flex gap-1.5">
                    {RESOLUTIONS.map((r) => {
                      const disabled =
                        r === "4K" && imageModel === "nano-banana";
                      return (
                        <button
                          key={r}
                          disabled={disabled}
                          onClick={() => setResolution(r)}
                          className={`flex-1 py-1.5 rounded-md text-[11px] font-medium border transition-all ${
                            resolution === r
                              ? "border-primary/30 bg-primary/10 text-primary"
                              : disabled
                                ? "border-border/20 text-muted-foreground/30 cursor-not-allowed"
                                : "border-border/30 text-muted-foreground hover:border-border/50"
                          }`}
                        >
                          {r}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Aspect Ratio */}
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">
                    Aspect Ratio
                  </label>
                  <div className="flex gap-1.5 flex-wrap">
                    {ASPECT_RATIOS.map((ar) => (
                      <button
                        key={ar}
                        onClick={() => setAspectRatio(ar)}
                        className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium border transition-all ${
                          aspectRatio === ar
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : "border-border/30 text-muted-foreground hover:border-border/50"
                        }`}
                      >
                        {ar}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Realism Level */}
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">
                    Realism Level
                  </label>
                  <div className="space-y-1">
                    {(
                      [
                        { value: "standard", label: "Standard", desc: "Balanced realism" },
                        {
                          value: "ultra",
                          label: "Ultra-Realistic",
                          desc: "Maximum skin detail",
                        },
                        ...(contentMode === "ugc"
                          ? [
                              {
                                value: "raw_phone",
                                label: "Raw Phone Camera",
                                desc: "Smartphone capture feel",
                              },
                            ]
                          : []),
                      ] as { value: RealismLevel; label: string; desc: string }[]
                    ).map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setRealismLevel(opt.value)}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left transition-all ${
                          realismLevel === opt.value
                            ? "bg-primary/5 border border-primary/20"
                            : "hover:bg-white/[0.02]"
                        }`}
                      >
                        <div
                          className={`w-3 h-3 rounded-full border-2 ${
                            realismLevel === opt.value
                              ? "border-primary bg-primary"
                              : "border-border"
                          }`}
                        />
                        <div>
                          <p className="text-[11px] font-medium">{opt.label}</p>
                          <p className="text-[9px] text-muted-foreground">{opt.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* H. Generate Button (pinned bottom) */}
        <div className="sticky bottom-0 p-4 border-t border-border/30 bg-card/80 backdrop-blur-sm">
          <Button
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
            className="w-full h-10 text-sm font-semibold"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>Generate {imageCount} Gambar</>
            )}
          </Button>
          <p className="text-[10px] text-muted-foreground text-center mt-1.5">
            Estimasi: {formatRupiah(totalCost)}
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL: Output ────────────────────────────── */}
      <div className="flex-1 overflow-y-auto lg:h-screen relative">
        {/* Empty State */}
        {imgGen.progress.status === "idle" && (
          <div className="flex items-center justify-center h-full p-8">
            <div className="text-center space-y-4 max-w-xs">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto">
                <ImagePlus className="h-6 w-6 text-white/15" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Upload karakter & produk, pilih gaya konten, lalu generate
                </p>
              </div>
              {/* Faded grid skeleton */}
              <div className="grid grid-cols-3 gap-2 opacity-20 mt-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[9/16] rounded-lg bg-white/[0.03] border border-white/[0.04]"
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Generating / Completed State */}
        {(isGenerating || isCompleted || imgGen.progress.status === "cancelled") && (
          <div className="p-4 lg:p-6 space-y-4">
            {/* Progress bar */}
            {isGenerating && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Membuat gambar {imgGen.progress.currentShot + 1} dari{" "}
                  {imgGen.progress.totalShots}
                  {shotPlans[imgGen.progress.currentShot] && (
                    <> — {shotPlans[imgGen.progress.currentShot].shotLabel}</>
                  )}
                  <span className="ml-2 text-muted-foreground/60">
                    {imgGen.progress.totalElapsed}s
                  </span>
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={imgGen.cancel}
                  className="text-xs h-7"
                >
                  Cancel
                </Button>
              </div>
            )}

            {/* Grid */}
            <div
              className={`grid gap-3 ${
                imageCount <= 3
                  ? "grid-cols-3"
                  : imageCount <= 6
                    ? "grid-cols-3"
                    : "grid-cols-3"
              }`}
            >
              {Array.from({ length: imgGen.progress.totalShots || imageCount }).map((_, i) => {
                const result = imgGen.progress.results[i];
                const isCurrent = isGenerating && imgGen.progress.currentShot === i;
                const isFailed = imgGen.progress.failedShots.includes(i);
                const shot = shotPlans[i];
                const upState = result ? getUpscaleState(`gen-${i}`) : null;

                return (
                  <div
                    key={i}
                    className={`relative rounded-xl overflow-hidden border transition-all group ${
                      aspectRatio === "9:16"
                        ? "aspect-[9/16]"
                        : aspectRatio === "1:1"
                          ? "aspect-square"
                          : aspectRatio === "4:5"
                            ? "aspect-[4/5]"
                            : aspectRatio === "3:4"
                              ? "aspect-[3/4]"
                              : "aspect-video"
                    } ${
                      result
                        ? "border-border/30"
                        : isCurrent
                          ? "border-primary/20"
                          : "border-white/[0.04]"
                    }`}
                  >
                    {result ? (
                      <>
                        <img
                          src={upState?.resultUrl || result.imageUrl}
                          alt={shot?.shotLabel || `Shot ${i + 1}`}
                          className="absolute inset-0 w-full h-full object-cover animate-scale-in"
                          onClick={() => setLightboxIdx(i)}
                        />
                        {/* Shot label badge */}
                        {shot && (
                          <span
                            className={`absolute bottom-2 left-2 text-[9px] px-2 py-0.5 rounded-md font-medium ${getStoryRoleColor(shot.storyRole, i)}`}
                          >
                            {shot.shotLabel}
                          </span>
                        )}
                        {/* Hover actions */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <ActionBtn
                            icon={RefreshCw}
                            label="Regenerate"
                            onClick={() =>
                              imgGen.retryShot({
                                shotIndex: i,
                                shot: shotPlans[i],
                                imageModel,
                                resolution,
                                aspectRatio,
                                kieApiKey,
                                characterImageUrl:
                                  selectedCharId === "own-photo"
                                    ? ownPhotoUrl || ""
                                    : selectedChar?.hero_image_url || "",
                                productImageUrl: productUrl || "",
                              })
                            }
                          />
                          <ActionBtn
                            icon={ArrowUpRight}
                            label="Upscale"
                            loading={upState?.loading}
                            onClick={() =>
                              upscale(`gen-${i}`, result.imageUrl, 2)
                            }
                          />
                          <ActionBtn
                            icon={Film}
                            label="Video"
                            onClick={() => openVideoPanel(i)}
                          />
                        </div>
                      </>
                    ) : isCurrent ? (
                      <div className="absolute inset-0 bg-white/[0.02] flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-primary/60" />
                        {shot && (
                          <span className="text-[10px] text-muted-foreground">
                            {shot.shotLabel}
                          </span>
                        )}
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

            {/* Bottom action bar */}
            {isCompleted && completedResults.length > 0 && (
              <div className="sticky bottom-0 flex items-center justify-between gap-3 py-3 px-4 -mx-4 lg:-mx-6 bg-card/80 backdrop-blur-sm border-t border-border/30">
                <div className="flex gap-2">
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
                    onClick={() => {
                      imgGen.reset();
                      setShotPlans([]);
                    }}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Generate Ulang
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Total: {formatRupiah(totalCost)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Video Side Panel ──────────────────────────────── */}
        {videoImageIdx !== null && (
          <div className="fixed inset-y-0 right-0 w-full lg:w-[400px] bg-card border-l border-border/40 z-50 overflow-y-auto animate-slide-up lg:animate-fade-slide-right">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Generate Video</h3>
                <button
                  onClick={() => {
                    setVideoImageIdx(null);
                    setVideoResult(null);
                  }}
                  className="p-1 hover:bg-white/[0.05] rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Source image thumbnail */}
              {completedResults[videoImageIdx] && (
                <div className="relative aspect-[9/16] max-h-[200px] rounded-xl overflow-hidden border border-border/30 mx-auto w-fit">
                  {videoResult ? (
                    <video
                      src={videoResult}
                      controls
                      className="h-full w-auto"
                      autoPlay
                    />
                  ) : (
                    <img
                      src={completedResults[videoImageIdx]!.imageUrl}
                      alt="Source"
                      className="h-full w-auto object-cover"
                    />
                  )}
                </div>
              )}

              {/* Model selector */}
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">
                  Video Model
                </label>
                <Select
                  value={videoModel}
                  onValueChange={(v) => setVideoModel(v as VideoModelType)}
                >
                  <SelectTrigger className="bg-background/50 border-border/40 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grok">
                      Grok (Cepat) — {formatRupiah(1240)}
                    </SelectItem>
                    <SelectItem value="kling_std">
                      Kling 3.0 Std — {formatRupiah(1860)}
                    </SelectItem>
                    <SelectItem value="kling_pro">
                      Kling 3.0 Pro — {formatRupiah(3560)}
                    </SelectItem>
                    <SelectItem value="veo_fast">
                      Veo 3.1 Fast — {formatRupiah(4960)}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Duration */}
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">
                  Duration: {videoDuration}s
                </label>
                <Slider
                  value={[videoDuration]}
                  onValueChange={([v]) => setVideoDuration(v)}
                  min={videoModel === "grok" ? 6 : 3}
                  max={
                    videoModel === "grok"
                      ? 10
                      : videoModel === "veo_fast"
                        ? 8
                        : 15
                  }
                  step={1}
                />
              </div>

              {/* Prompt */}
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">
                  Motion Prompt
                </label>
                <Textarea
                  value={videoPrompt}
                  onChange={(e) => setVideoPrompt(e.target.value)}
                  className="text-xs min-h-[100px] bg-background/50 border-border/40"
                  placeholder="Describe the motion..."
                />
              </div>

              {/* Generate */}
              <Button
                onClick={handleVideoGenerate}
                disabled={videoGenerating || !videoPrompt}
                className="w-full h-9 text-xs"
              >
                {videoGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Generating...
                  </>
                ) : (
                  <>
                    Generate Video — {formatRupiah(VIDEO_COST[videoModel] || 1860)}
                  </>
                )}
              </Button>

              {videoResult && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-8"
                    asChild
                  >
                    <a href={videoResult} download target="_blank" rel="noreferrer">
                      <Download className="w-3.5 h-3.5 mr-1" />
                      Download
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => {
                      setVideoResult(null);
                      setVideoImageIdx(null);
                    }}
                  >
                    Kembali
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Lightbox Modal ───────────────────────────────── */}
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
    </div>
  );
};

// ── Helper Components ───────────────────────────────────────────
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        {label}
      </h3>
      {children}
    </div>
  );
}

function DNACard({ dna }: { dna: ProductDNA }) {
  const categoryColors: Record<string, string> = {
    skincare: "bg-pink-500/15 text-pink-400",
    fashion: "bg-purple-500/15 text-purple-400",
    food: "bg-orange-500/15 text-orange-400",
    electronics: "bg-blue-500/15 text-blue-400",
    health: "bg-green-500/15 text-green-400",
    home: "bg-amber-500/15 text-amber-400",
    other: "bg-gray-500/15 text-gray-400",
  };

  return (
    <div className="p-2.5 rounded-lg border border-border/30 bg-white/[0.02] space-y-1.5">
      <div className="flex items-center gap-2">
        <span
          className={`text-[9px] px-2 py-0.5 rounded-md font-medium ${categoryColors[dna.category] || categoryColors.other}`}
        >
          {dna.category}
        </span>
        <span className="text-[10px] text-muted-foreground">{dna.sub_category}</span>
      </div>
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-sm border border-border/40"
          style={{ backgroundColor: dna.dominant_color }}
        />
        <span className="text-[10px] text-muted-foreground">{dna.brand_name}</span>
      </div>
      {dna.ugc_hook && (
        <p className="text-[10px] text-muted-foreground/80 italic">"{dna.ugc_hook}"</p>
      )}
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
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Icon className="w-4 h-4" />
      )}
      <span className="text-[9px]">{label}</span>
    </button>
  );
}

export default GeneratePage;
