import { useState, useEffect, useRef, useCallback } from "react";
import { analyzeStartImage, imageUrlToBase64 as analyzerImageUrlToBase64 } from "@/lib/product-analyzer";
import {
  Upload,
  X,
  Film,
  Sparkles,
  AlertTriangle,
  Download,
  RefreshCw,
  Loader2,
  Info,
  Images,
  Copy,
  Volume2,
  Zap,
  Clapperboard,
  CheckCircle,
} from "lucide-react";
import { generateVideoAndWait } from "@/lib/kie-video-generation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useApiKeys } from "@/hooks/useApiKeys";
import { usePromptModel } from "@/hooks/usePromptModel";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import MultiShotCreator from "@/components/video/MultiShotCreator";
import GenerationLoading from "@/components/GenerationLoading";

type VideoModel = "grok" | "veo_fast" | "veo_quality";
type GenState = "idle" | "loading" | "completed" | "failed";
type VideoMode = "quick" | "multishot";
type StartImageTab = "gallery" | "upload";

interface GalleryImage {
  id: string;
  image_url: string;
  created_at: string;
  model?: string;
  metadata?: any;
}

const MODEL_INFO: Record<VideoModel, { label: string; badge: string; badgeColor: string; subtitle: string; desc: string; cost: string }> = {
  grok: {
    label: "Grok Imagine",
    badge: "HEMAT",
    badgeColor: "bg-green-500/20 text-green-400",
    subtitle: "~Rp 1.600/clip · Cepat",
    desc: "Bagus untuk UGC, iterasi cepat",
    cost: "~Rp 1.600",
  },
  veo_fast: {
    label: "Veo 3.1 Fast",
    badge: "STANDARD",
    badgeColor: "bg-blue-500/20 text-blue-400",
    subtitle: "~Rp 4.800/clip · 15-30 detik",
    desc: "Kualitas lebih tinggi, audio native",
    cost: "~Rp 4.800",
  },
  veo_quality: {
    label: "Veo 3.1 Quality",
    badge: "PREMIUM",
    badgeColor: "bg-primary/20 text-primary",
    subtitle: "~Rp 19.200/clip · 1-2 menit",
    desc: "Kualitas sinematik, untuk iklan",
    cost: "~Rp 19.200",
  },
};

const MODEL_BADGE_MAP: Record<string, string> = {
  "nano": "Nano",
  "seedream": "Seedream",
  "grok-imagine": "Grok",
  "veo3_fast": "Veo Fast",
  "veo3": "Veo Quality",
};

const VideoPage = () => {
  const { user } = useAuth();
  const { kieApiKey, geminiKey, keys } = useApiKeys();
  const { model: promptModel } = usePromptModel();
  const { toast } = useToast();

  // Mode toggle
  const [mode, setMode] = useState<VideoMode>("quick");

  // Start Image
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [selectedGenerationId, setSelectedGenerationId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [startImageTab, setStartImageTab] = useState<StartImageTab>("gallery");

  // Scene analysis
  const [imageAnalysis, setImageAnalysis] = useState<string>("");
  const [analyzingImage, setAnalyzingImage] = useState(false);

  // Gallery
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryOffset, setGalleryOffset] = useState(0);
  const [hasMoreGallery, setHasMoreGallery] = useState(false);
  const GALLERY_PAGE_SIZE = 20;

  // Settings
  const [videoModel, setVideoModel] = useState<VideoModel>("grok");
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "16:9">("9:16");
  const [prompt, setPrompt] = useState("");
  const [generatingPrompt, setGeneratingPrompt] = useState(false);
  const [promptEnhanced, setPromptEnhanced] = useState(false);
  const [promptFlash, setPromptFlash] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Generation
  const [genState, setGenState] = useState<GenState>("idle");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [finalPrompt, setFinalPrompt] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef(false);

  // Audio feedback
  const [audioFeedbackShown, setAudioFeedbackShown] = useState(true);

  const startTimer = () => {
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
  };
  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  /* ── Load Gallery on mount ──────────────────────────────── */
  const loadGallery = useCallback(async (offset = 0, append = false) => {
    if (!user) return;
    setGalleryLoading(true);
    const { data } = await supabase
      .from("generations")
      .select("id, image_url, created_at, model, metadata")
      .eq("user_id", user.id)
      .not("image_url", "is", null)
      .neq("type", "video")
      .order("created_at", { ascending: false })
      .range(offset, offset + GALLERY_PAGE_SIZE - 1);
    const results = (data as GalleryImage[]) || [];
    setGalleryImages(append ? (prev) => [...prev, ...results] : results);
    setHasMoreGallery(results.length === GALLERY_PAGE_SIZE);
    setGalleryOffset(offset + results.length);
    setGalleryLoading(false);
  }, [user]);

  useEffect(() => {
    loadGallery(0);
  }, [loadGallery]);

  /* ── Run scene analysis ─────────────────────────────────── */
  const runSceneAnalysis = async (imageUrl: string) => {
    if (!geminiKey || keys.gemini.status !== "valid") return;
    setAnalyzingImage(true);
    try {
      const base64 = await analyzerImageUrlToBase64(imageUrl);
      const analysis = await analyzeStartImage(base64, geminiKey, promptModel);
      setImageAnalysis(analysis);
      console.log("[video] Scene analysis completed, length:", analysis.length);

      // Save to generation record if we have one
      if (selectedGenerationId) {
        await supabase
          .from("generations")
          .update({ metadata: { scene_analysis: analysis } } as any)
          .eq("id", selectedGenerationId);
      }
    } catch (err) {
      console.error("Scene analysis failed:", err);
    } finally {
      setAnalyzingImage(false);
    }
  };

  /* ── Select from Gallery ────────────────────────────────── */
  const selectFromGallery = (img: GalleryImage) => {
    setSourcePreview(img.image_url);
    setSourceUrl(img.image_url);
    setSelectedGenerationId(img.id);
    // Check for saved analysis
    if (img.metadata?.scene_analysis) {
      setImageAnalysis(img.metadata.scene_analysis);
      console.log("Loaded saved scene analysis");
    } else {
      // Run fresh analysis
      runSceneAnalysis(img.image_url);
    }
  };

  /* ── Upload Image ───────────────────────────────────────── */
  const handleFileSelect = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File terlalu besar", description: "Maksimal 10MB", variant: "destructive" });
      return;
    }
    setSourcePreview(URL.createObjectURL(file));
    setUploading(true);
    setSelectedGenerationId(null);
    const ext = file.name.split(".").pop();
    const path = `${user!.id}/video-sources/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) {
      toast({ title: "Upload gagal", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
    const publicUrl = urlData.publicUrl;
    setSourceUrl(publicUrl);
    setUploading(false);
    runSceneAnalysis(publicUrl);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const removeSource = () => {
    setSourcePreview(null);
    setSourceUrl(null);
    setImageAnalysis("");
    setSelectedGenerationId(null);
  };

  /* ── Flash animation helper ─────────────────────────────── */
  const flashTextarea = () => {
    setPromptFlash(true);
    setTimeout(() => setPromptFlash(false), 300);
  };

  /* ── Gemini Prompt Helper ────────────────────────────────── */
  const enhancePrompt = async (): Promise<string> => {
    if (!geminiKey || keys.gemini.status !== "valid") {
      toast({ title: "Gemini API key belum di-setup", description: "Buka Settings.", variant: "destructive" });
      return prompt;
    }
    setGeneratingPrompt(true);
    try {
      const userContext = prompt.trim() || "product/person photo";
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${promptModel}:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{
                text: `You are an expert video prompt builder for AI video generation. The user has a source image and wants to create a short 5-8 second UGC-style video for TikTok/Reels.\n\nCreate a concise, action-focused English video prompt. Describe:\n- The specific MOTION and ACTION (what moves, how fast, direction)\n- Camera movement (static, slow zoom in, gentle pan, handheld feel)\n- Expression and body language changes\n- The mood and energy level\n\nKeep it under 80 words. Veo and Grok work best with concise, specific motion prompts.\n\nDo NOT describe what's already in the image. Only describe what MOVES and CHANGES.\n\nIMPORTANT: Replace any placeholder brackets like [DIALOGUE: ...] with actual natural dialogue text. The output must be clean — no brackets, no placeholders, no template markers.\n${imageAnalysis ? `\n=== START IMAGE ANALYSIS (FIRST FRAME REFERENCE) ===\n${imageAnalysis}\n\nThe video MUST start with a frame that matches this description EXACTLY.\nEvery detail — face, outfit, product grip, lighting, background — must be identical to this reference.\nThe video is this image coming to life with natural motion.\n` : ''}\nRespond with just the prompt text, no JSON, no quotes, no explanation.`,
              }],
            },
            contents: [{
              parts: [{ text: `Source image context: ${userContext}. Create a video prompt for a UGC-style TikTok clip.` }],
            }],
          }),
        }
      );
      const json = await res.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const enhanced = text.trim();
      setPrompt(enhanced);
      setPromptEnhanced(true);
      flashTextarea();
      return enhanced;
    } catch {
      toast({ title: "Gagal generate prompt", variant: "destructive" });
      return prompt;
    } finally {
      setGeneratingPrompt(false);
    }
  };

  /* ── Video Generation ────────────────────────────────────── */
  const generate = async () => {
    if (!kieApiKey || keys.kie_ai.status !== "valid") {
      toast({ title: "Kie AI API key belum di-setup", variant: "destructive" });
      return;
    }
    if (!sourceUrl || !prompt.trim()) return;

    abortRef.current = false;
    setGenState("loading");
    setVideoUrl(null);
    setErrorMsg("");
    setAudioFeedbackShown(true);
    startTimer();

    try {
      let usedPrompt = prompt;
      if (!promptEnhanced && geminiKey && keys.gemini.status === "valid") {
        usedPrompt = await enhancePrompt();
      }
      setFinalPrompt(usedPrompt);

      const result = await generateVideoAndWait(
        {
          model: videoModel,
          prompt: usedPrompt,
          imageUrls: [sourceUrl],
          duration: 6,
          aspectRatio,
          apiKey: kieApiKey,
        },
        () => abortRef.current,
      );
      const resultVideoUrl = result.videoUrl;
      stopTimer();
      setVideoUrl(resultVideoUrl);
      setGenState("completed");

      const { error: saveError } = await supabase.from("generations").insert({
        user_id: user!.id,
        type: "video",
        image_url: resultVideoUrl,
        prompt: usedPrompt,
        model: videoModel === "grok" ? "grok-imagine" : videoModel === "veo_fast" ? "veo3_fast" : "veo3",
        provider: "kie_ai",
        status: "completed",
        metadata: {
          scene_analysis: imageAnalysis || undefined,
          source_image_url: sourceUrl,
        },
      } as any);
      if (saveError) {
        console.error("Save error:", saveError);
        sonnerToast.error("Gagal menyimpan. Coba download manual.");
      } else {
        sonnerToast.success("Video berhasil disimpan ke gallery!");
      }
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

  const copyPrompt = () => {
    navigator.clipboard.writeText(finalPrompt || prompt);
    sonnerToast.success("Prompt di-copy!");
  };

  const canGenerate = !!sourceUrl && !!prompt.trim() && genState !== "loading";
  const info = MODEL_INFO[videoModel];

  // If multi-shot mode, render that component instead
  if (mode === "multishot") {
    return (
      <div className="-mx-4 -my-4 lg:-mx-6 lg:-my-8">
        {/* Mode Toggle */}
        <div className="px-4 lg:px-6 pt-6 lg:pt-8">
          <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit mx-auto sm:mx-0">
            <button
              onClick={() => setMode("quick")}
              className="text-xs font-medium px-4 py-2 rounded-md transition-colors text-muted-foreground hover:text-foreground"
            >
              <Zap className="h-3.5 w-3.5 inline mr-1.5" />
              Quick Video
            </button>
            <button
              className="text-xs font-medium px-4 py-2 rounded-md transition-colors bg-background text-foreground shadow-sm"
            >
              <Clapperboard className="h-3.5 w-3.5 inline mr-1.5" />
              Multi-Shot Creator
            </button>
          </div>
        </div>
        <MultiShotCreator />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row lg:min-h-[calc(100vh-0px)] -mx-4 -my-4 lg:-mx-6 lg:-my-8">
      {/* LEFT PANEL */}
      <div className="w-full lg:w-[55%] overflow-y-auto px-4 lg:px-6 py-6 lg:py-8 space-y-6">
        {/* Header + Mode Toggle */}
        <div className="animate-fade-up">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
            <div>
              <h1 className="text-xl font-bold font-satoshi tracking-wider uppercase text-foreground">Buat Video</h1>
              <p className="text-xs text-muted-foreground mt-1">Generate video UGC 5-8 detik dari gambar</p>
            </div>
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              <button
                className="text-xs font-medium px-4 py-2 rounded-md transition-colors bg-background text-foreground shadow-sm"
              >
                <Zap className="h-3.5 w-3.5 inline mr-1.5" />
                Quick Video
              </button>
              <button
                onClick={() => setMode("multishot")}
                className="text-xs font-medium px-4 py-2 rounded-md transition-colors text-muted-foreground hover:text-foreground"
              >
                <Clapperboard className="h-3.5 w-3.5 inline mr-1.5" />
                Multi-Shot Creator
              </button>
            </div>
          </div>
        </div>

        {/* Start Image */}
        <div className="animate-fade-up" style={{ animationDelay: "100ms" }}>
          <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium block mb-2.5">Start Image</label>
          
          {sourcePreview ? (
            <div>
              <div className="relative inline-block">
                <img src={sourcePreview} alt="Start" className="max-w-[200px] rounded-xl object-cover border border-border" />
                <button onClick={removeSource} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                  <X className="h-3 w-3" />
                </button>
                {uploading && (
                  <div className="absolute inset-0 bg-background/60 rounded-xl flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
              </div>
              {/* Analysis status */}
              {analyzingImage && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Menganalisis gambar...
                </div>
              )}
              {imageAnalysis && !analyzingImage && (
                <div className="flex items-center gap-1.5 text-xs text-primary/70 mt-2">
                  <CheckCircle className="w-3 h-3" />
                  Gambar teranalisis — siap generate video
                </div>
              )}
              <button
                onClick={removeSource}
                className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Ganti Start Image
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Tabs */}
              <div className="flex gap-1 bg-muted rounded-lg p-1">
                <button
                  onClick={() => setStartImageTab("gallery")}
                  className={`flex-1 text-xs font-medium px-3 py-2 rounded-md transition-colors ${
                    startImageTab === "gallery" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Images className="h-3.5 w-3.5 inline mr-1.5" />
                  Pilih dari Gallery
                </button>
                <button
                  onClick={() => setStartImageTab("upload")}
                  className={`flex-1 text-xs font-medium px-3 py-2 rounded-md transition-colors ${
                    startImageTab === "upload" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Upload className="h-3.5 w-3.5 inline mr-1.5" />
                  Upload Baru
                </button>
              </div>

              {/* Gallery Tab */}
              {startImageTab === "gallery" && (
                <div>
                  {galleryLoading && galleryImages.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  ) : galleryImages.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">Belum ada gambar di gallery</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Generate gambar di Buat Gambar terlebih dahulu</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-[11px] text-muted-foreground/60">Pilih gambar untuk dijadikan video</p>
                      <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
                        {galleryImages.map((img) => (
                          <button
                            key={img.id}
                            onClick={() => selectFromGallery(img)}
                            className="aspect-square rounded-lg overflow-hidden border border-border hover:border-primary/50 hover:scale-105 transition-all relative group"
                          >
                            <img src={img.image_url!} alt="" className="w-full h-full object-cover" />
                            {img.model && (
                              <span className="absolute bottom-1 left-1 text-[9px] bg-background/80 backdrop-blur-sm text-foreground px-1.5 py-0.5 rounded-full">
                                {MODEL_BADGE_MAP[img.model] || img.model}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                      {hasMoreGallery && (
                        <button
                          onClick={() => loadGallery(galleryOffset, true)}
                          disabled={galleryLoading}
                          className="w-full text-xs text-primary py-2 hover:underline disabled:opacity-50"
                        >
                          {galleryLoading ? <Loader2 className="h-3 w-3 animate-spin inline mr-1" /> : null}
                          Muat lebih banyak
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Upload Tab */}
              {startImageTab === "upload" && (
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
                  <p className="text-sm text-muted-foreground">Upload gambar baru</p>
                  <p className="text-[11px] text-muted-foreground/60">JPEG, PNG, WebP — Maks 10MB</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Video Model */}
        <div className="animate-fade-up" style={{ animationDelay: "150ms" }}>
          <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium block mb-2.5">Video Model</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(["grok", "veo_fast", "veo_quality"] as VideoModel[]).map((m) => {
              const mi = MODEL_INFO[m];
              const selected = videoModel === m;
              return (
                <button
                  key={m}
                  onClick={() => setVideoModel(m)}
                  className={`text-left rounded-xl p-3.5 transition-colors ${
                    selected
                      ? "border-2 border-primary bg-primary/5"
                      : "border border-border bg-card hover:border-muted-foreground/30"
                  }`}
                >
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${mi.badgeColor}`}>
                    {mi.badge}
                  </span>
                  <p className="text-sm font-semibold text-foreground mt-2">{mi.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{mi.subtitle}</p>
                  <p className="text-[11px] text-muted-foreground/60 mt-1">{mi.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Aspect Ratio */}
        <div className="animate-fade-up" style={{ animationDelay: "200ms" }}>
          <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium block mb-2.5">Aspect Ratio</label>
          <ToggleGroup type="single" value={aspectRatio} onValueChange={(v) => v && setAspectRatio(v as "9:16" | "16:9")} className="w-full sm:w-auto">
            <ToggleGroupItem value="9:16" className="text-xs px-4 flex-1 sm:flex-none">9:16 Portrait</ToggleGroupItem>
            <ToggleGroupItem value="16:9" className="text-xs px-4 flex-1 sm:flex-none">16:9 Landscape</ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Prompt */}
        <div className="animate-fade-up" style={{ animationDelay: "250ms" }}>
          <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium block mb-2.5">Video Prompt</label>
          <Textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => { setPrompt(e.target.value); setPromptEnhanced(false); }}
            rows={4}
            placeholder="Deskripsikan gerakan yang kamu inginkan... Contoh: Person smiles and holds up the product, looking at camera naturally"
            className={`bg-muted/30 border-border text-sm transition-all duration-300 ${promptFlash ? "border-green-500 ring-2 ring-green-500/30" : ""}`}
          />
          <button
            onClick={enhancePrompt}
            disabled={generatingPrompt}
            className="mt-2 inline-flex items-center gap-2 border border-primary text-primary text-xs font-bold px-4 py-2 rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
          >
            {generatingPrompt ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            ENHANCE & GENERATE PROMPT
          </button>
          <p className="text-[11px] text-muted-foreground/60 mt-1.5">Edit prompt untuk hasil yang lebih baik</p>
        </div>

        {/* TikTok Note */}
        <div className="animate-fade-up" style={{ animationDelay: "300ms" }}>
          <div className="flex items-start gap-2 bg-primary/10 border border-primary/20 rounded-lg p-3">
            <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              Ingat: Toggle &apos;AI-generated content&apos; saat upload ke TikTok. Konten AI yang dilabeli TIDAK akan dikurangi jangkauannya.
            </p>
          </div>
        </div>

        {/* Cost + Generate */}
        <div className="animate-fade-up" style={{ animationDelay: "350ms" }}>
          <div className="flex items-start gap-2 bg-card border border-border rounded-lg p-3 mb-4">
            <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Estimasi: {info.cost} dari API key kamu</p>
              <p className="text-[11px] text-muted-foreground/60">Output tanpa watermark</p>
            </div>
          </div>
          <button
            onClick={generate}
            disabled={!canGenerate}
            className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-wider py-3.5 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-40"
          >
            {genState === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Film className="h-4 w-4" />
            )}
            GENERATE VIDEO
          </button>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-[45%] bg-muted/20 border-t lg:border-t-0 lg:border-l border-border flex items-center justify-center p-6 lg:p-10 min-h-[400px] lg:min-h-0">
        {genState === "idle" && (
          <div className="flex flex-col items-center text-center animate-fade-in">
            <Film className="h-16 w-16 text-foreground/10 mb-4" />
            <p className="text-sm text-muted-foreground">Hasil video akan muncul di sini</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Pilih gambar, atur keyword, dan generate!</p>
          </div>
        )}

        {genState === "loading" && (
          <GenerationLoading
            model={videoModel}
            elapsed={elapsed}
            aspectRatio={aspectRatio}
            prompt={finalPrompt || prompt}
            modelLabel={info.label}
            badgeColor={info.badgeColor}
            onCancel={cancelGeneration}
          />
        )}

        {genState === "completed" && videoUrl && (
          <div className="flex flex-col items-center gap-4 w-full max-w-sm animate-fade-in">
            <video
              src={videoUrl}
              controls
              autoPlay
              loop
              playsInline
              className={`w-full rounded-xl border-2 border-primary/20 shadow-lg ${aspectRatio === "9:16" ? "aspect-[9/16]" : "aspect-[16/9]"} object-cover`}
            />
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap justify-center">
              <span className={`font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-[10px] ${info.badgeColor}`}>{info.label}</span>
              <span>•</span>
              <span>{elapsed}s</span>
              <span className="inline-flex items-center gap-1 bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full text-[10px] font-medium">
                <Volume2 className="h-3 w-3" /> Audio native
              </span>
            </div>

            {audioFeedbackShown && (
              <div className="w-full bg-card border border-border rounded-lg p-3 space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Audio oke?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAudioFeedbackShown(false)}
                    className="flex-1 text-xs py-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                  >
                    Bagus
                  </button>
                  <button
                    onClick={() => {
                      setAudioFeedbackShown(false);
                      sonnerToast.info("Tip: Edit prompt untuk memperbaiki dialog, lalu generate ulang.");
                    }}
                    className="flex-1 text-xs py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                  >
                    Kurang
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-2 w-full flex-wrap">
              <a
                href={videoUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-primary text-primary-foreground font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors min-w-[120px]"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </a>
              <button
                onClick={copyPrompt}
                className="border border-border text-muted-foreground text-xs py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 hover:text-foreground transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy Prompt
              </button>
              <button
                onClick={() => { setGenState("idle"); setVideoUrl(null); setPromptEnhanced(false); }}
                className="border border-border text-muted-foreground text-xs py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 hover:text-foreground transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Generate Lagi
              </button>
            </div>
          </div>
        )}

        {genState === "failed" && (
          <div className="flex flex-col items-center gap-4 w-full max-w-xs animate-fade-in">
            <div className="w-full border border-destructive/30 bg-destructive/5 rounded-xl p-6 flex flex-col items-center gap-3 text-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-destructive">{errorMsg || "Terjadi kesalahan"}</p>
            </div>
            <button onClick={generate} className="bg-primary text-primary-foreground font-bold text-xs px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors">
              Coba Lagi
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPage;