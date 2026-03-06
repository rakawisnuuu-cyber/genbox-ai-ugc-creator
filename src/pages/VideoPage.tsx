import { useState, useEffect, useRef, useCallback } from "react";
import { geminiFetch } from "@/lib/gemini-fetch";
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
  MessageCircle,
  Package,
  ArrowRightLeft,
  Sun,
  ShoppingBag,
  Eye,
  Star,
  AlertCircle,
  Shuffle,
} from "lucide-react";
import { generateVideoAndWait, normalizeDurationForModel } from "@/lib/kie-video-generation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useApiKeys } from "@/hooks/useApiKeys";
import { usePromptModel } from "@/hooks/usePromptModel";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";
import MultiShotCreator from "@/components/video/MultiShotCreator";
import GenerationLoading from "@/components/GenerationLoading";
import {
  CONTENT_TEMPLATES,
  type ContentTemplateKey,
  type ContentTemplate,
  getContentTemplate,
  buildTimingDescription,
  isRecommendedForCategory,
  getModelBadge,
} from "@/lib/content-templates";
import {
  getRandomHooks,
  getRandomBodyScripts,
  BODY_SCRIPTS,
} from "@/lib/tiktok-hooks";

type VideoModel = "grok" | "veo_fast" | "veo_quality";
type GenState = "idle" | "loading" | "completed" | "failed";
type VideoMode = "quick" | "multishot";

interface GalleryImage {
  id: string;
  image_url: string;
  prompt: string | null;
  metadata: any;
  created_at: string;
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

const ICON_MAP: Record<string, React.ElementType> = {
  Zap, MessageCircle, Package, ArrowRightLeft, Sun, ShoppingBag, Eye,
  Waves: Sparkles,
};

/** Convert image URL to base64 data URI for Gemini inline image */
async function imageUrlToBase64(url: string): Promise<{ mimeType: string; data: string } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const mimeType = blob.type || "image/jpeg";
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        if (base64) {
          resolve({ mimeType, data: base64 });
        } else {
          resolve(null);
        }
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

const VideoPage = () => {
  const { user } = useAuth();
  const { kieApiKey, geminiKey, keys } = useApiKeys();
  const { model: promptModel } = usePromptModel();
  const { toast } = useToast();

  // Mode toggle
  const [mode, setMode] = useState<VideoMode>("quick");

  // Source image
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [sourceGenId, setSourceGenId] = useState<string | null>(null);
  const [sourcePrompt, setSourcePrompt] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [detectedCategory, setDetectedCategory] = useState<string | null>(null);

  // Inline gallery
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryLoaded, setGalleryLoaded] = useState(false);

  // Content template
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplateKey>("problem_solution");

  // Dialogue toggle + script builder
  const [withDialogue, setWithDialogue] = useState(false);
  const [dialogueText, setDialogueText] = useState("");
  const [hookOptions, setHookOptions] = useState<string[]>([]);
  const [bodyOptions, setBodyOptions] = useState<string[]>([]);
  const [selectedHook, setSelectedHook] = useState("");
  const [selectedBody, setSelectedBody] = useState("");
  const [generatingScript, setGeneratingScript] = useState(false);

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

  /* ── Refresh hook/body suggestions when template changes ── */
  const refreshHooks = useCallback(() => {
    setHookOptions(getRandomHooks(selectedTemplate, 5));
  }, [selectedTemplate]);

  const refreshBodyScripts = useCallback(() => {
    setBodyOptions(getRandomBodyScripts(selectedTemplate, 4));
  }, [selectedTemplate]);

  useEffect(() => {
    refreshHooks();
    refreshBodyScripts();
    setSelectedHook("");
    setSelectedBody("");
  }, [selectedTemplate, refreshHooks, refreshBodyScripts]);

  /* ── Sync dialogueText when hook/body selection changes ── */
  useEffect(() => {
    if (!withDialogue) return;
    const parts = [selectedHook, selectedBody].filter(Boolean);
    if (parts.length > 0) {
      setDialogueText(parts.join(" "));
    }
  }, [selectedHook, selectedBody, withDialogue]);

  /* ── Load gallery images on mount ─────────────────────────── */
  useEffect(() => {
    if (!user || galleryLoaded) return;
    const load = async () => {
      setGalleryLoading(true);
      const { data } = await supabase
        .from("generations")
        .select("id, image_url, prompt, metadata, created_at")
        .eq("user_id", user.id)
        .not("image_url", "is", null)
        .neq("type", "video")
        .order("created_at", { ascending: false })
        .limit(12);
      setGalleryImages((data as GalleryImage[]) || []);
      setGalleryLoading(false);
      setGalleryLoaded(true);
    };
    load();
  }, [user, galleryLoaded]);

  /* ── Source Image Upload ──────────────────────────────────── */
  const handleFileSelect = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File terlalu besar", description: "Maksimal 10MB", variant: "destructive" });
      return;
    }
    setSourcePreview(URL.createObjectURL(file));
    setSourceGenId(null);
    setSourcePrompt(null);
    setDetectedCategory(null);
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user!.id}/video-sources/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) {
      toast({ title: "Upload gagal", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
    setSourceUrl(urlData.publicUrl);
    setUploading(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const removeSource = () => {
    setSourcePreview(null);
    setSourceUrl(null);
    setSourceGenId(null);
    setSourcePrompt(null);
    setDetectedCategory(null);
  };

  /* ── Select from inline gallery ──────────────────────────── */
  const selectFromGallery = (img: GalleryImage) => {
    setSourcePreview(img.image_url);
    setSourceUrl(img.image_url);
    setSourceGenId(img.id);
    setSourcePrompt(img.prompt);
    const meta = img.metadata as any;
    if (meta?.product_category) {
      setDetectedCategory(meta.product_category);
    } else {
      setDetectedCategory(null);
    }
  };

  /* ── Flash animation helper ─────────────────────────────── */
  const flashTextarea = () => {
    setPromptFlash(true);
    setTimeout(() => setPromptFlash(false), 300);
  };

  /* ── Generate full dialog script via Gemini ──────────────── */
  const generateDialogScript = async () => {
    if (!geminiKey || keys.gemini.status !== "valid") {
      toast({ title: "Gemini API key belum di-setup", variant: "destructive" });
      return;
    }
    setGeneratingScript(true);
    try {
      const template = getContentTemplate(selectedTemplate);
      const templateLabel = template?.label || selectedTemplate;
      const hookContext = selectedHook ? `Starting hook: "${selectedHook}"` : "";
      const categoryContext = detectedCategory ? `Product category: ${detectedCategory}` : "";
      const sourceContext = sourcePrompt ? `Product/scene context: ${sourcePrompt.substring(0, 200)}` : "";

      const sysPrompt = `You are a TikTok content script writer specializing in Indonesian casual/gaul language.
Write a 3-4 sentence TikTok dialog script in casual Indonesian (bahasa gaul).
Structure: hook (attention grabber) → body (product experience) → CTA (soft recommendation).
Make it sound like a real person talking naturally to their phone camera.
Keep it under 40 words total. Output ONLY the script text, no explanation.`;

      const userPrompt = `Content style: ${templateLabel}
${hookContext}
${categoryContext}
${sourceContext}
Write the full script now.`.trim();

      const json = await geminiFetch(promptModel, geminiKey!, {
        systemInstruction: { parts: [{ text: sysPrompt }] },
        contents: [{ parts: [{ text: userPrompt }] }],
      });
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
      if (text) {
        setDialogueText(text);
        setSelectedHook("");
        setSelectedBody("");
        sonnerToast.success("Script generated!");
      }
    } catch (err: any) {
      toast({ title: "Gagal generate script", description: err?.message, variant: "destructive" });
    } finally {
      setGeneratingScript(false);
    }
  };

  /* ── Gemini Prompt Enhancement (template-aware + image) ──── */
  const enhancePrompt = async (): Promise<string> => {
    if (!geminiKey || keys.gemini.status !== "valid") {
      toast({ title: "Gemini API key belum di-setup", description: "Buka Settings.", variant: "destructive" });
      return prompt;
    }
    setGeneratingPrompt(true);
    try {
      const template = getContentTemplate(selectedTemplate);
      const timingInfo = template
        ? buildTimingDescription(template, videoModel)
        : null;

      const targetDuration = timingInfo?.duration || (videoModel === "grok" ? 10 : 20);

      const { buildVideoDirectorInstruction } = await import("@/lib/frame-lock-prompt");
      const sysText = buildVideoDirectorInstruction({
        shotIndex: 0,
        totalShots: 1,
        duration: targetDuration,
        moduleType: template?.key || "demo",
        withDialogue,
        dialogueText: withDialogue && dialogueText.trim() ? dialogueText.trim() : null,
        audioDirection: withDialogue ? "natural spoken dialogue, clear and intimate" : "ambient sounds only, no speech",
        contentTemplate: template?.key,
        templateStructure: timingInfo?.description,
        model: videoModel,
      });

      const templateSection = timingInfo
        ? `\n\n=== CONTENT TEMPLATE: ${template!.label.toUpperCase()} ===\n${timingInfo.description}\n\nCRITICAL: Create a SINGLE continuous video prompt covering this full narrative arc in one take. Describe one continuous flowing scene where the person naturally transitions through each beat. Do NOT describe separate shots or cuts. Target duration: ${targetDuration} seconds. Adjust all timing beats proportionally. Pacing must feel natural, not rushed.`
        : "";

      const dialogueSection = withDialogue && dialogueText.trim()
        ? `\n\nInclude natural spoken dialogue in the video: "${dialogueText.trim()}"`
        : "";

      const sourceContext = sourcePrompt
        ? `Source image context (from original generation): ${sourcePrompt}`
        : prompt.trim() || "product/person photo";

      const categoryContext = detectedCategory
        ? `\nProduct category: ${detectedCategory}`
        : "";

      // Build content parts — include source image as base64 if available
      const contentParts: any[] = [];

      if (sourceUrl) {
        const imageData = await imageUrlToBase64(sourceUrl);
        if (imageData) {
          contentParts.push({
            inlineData: { mimeType: imageData.mimeType, data: imageData.data },
          });
          contentParts.push({
            text: "This is the source image. Describe the EXACT person, product, setting, and lighting you see — your prompt must match this image precisely.",
          });
        }
      }

      contentParts.push({
        text: `${sourceContext}${categoryContext}${dialogueSection}\n\nCreate a video prompt for a UGC-style TikTok clip following the content template timing structure above. One continuous scene, natural transitions between beats.`,
      });

      console.log("=== VIDEO ENHANCE PROMPT ===", "Model:", promptModel, "Template:", selectedTemplate, "WithImage:", !!sourceUrl);
      const json = await geminiFetch(promptModel, geminiKey!, {
        systemInstruction: { parts: [{ text: `${sysText}${templateSection}` }] },
        contents: [{ parts: contentParts }],
      });
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (!text) {
        const reason = json.candidates?.[0]?.finishReason || json.promptFeedback?.blockReason;
        throw new Error(`Empty response${reason ? `: ${reason}` : ""}`);
      }
      const enhanced = text.trim();
      setPrompt(enhanced);
      setPromptEnhanced(true);
      flashTextarea();
      return enhanced;
    } catch (err: any) {
      toast({ title: "Gagal generate prompt", description: err?.message || "Unknown error", variant: "destructive" });
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

      const template = getContentTemplate(selectedTemplate);
      const timingInfo = template ? buildTimingDescription(template, videoModel) : null;
      const duration = timingInfo?.duration || (videoModel === "grok" ? 10 : 6);

      const result = await generateVideoAndWait(
        {
          model: videoModel,
          prompt: usedPrompt,
          imageUrls: [sourceUrl],
          duration,
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
          content_template: selectedTemplate,
          with_dialogue: withDialogue,
          source_generation_id: sourceGenId,
        },
      });
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
              <p className="text-xs text-muted-foreground mt-1">Generate video UGC lengkap dari 1 gambar</p>
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

        {/* Source Image — Inline Gallery + Upload */}
        <div className="animate-fade-up" style={{ animationDelay: "100ms" }}>
          <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium block mb-2.5">Source Image</label>
          {sourcePreview ? (
            <div className="relative inline-block">
              <img src={sourcePreview} alt="Source" className="max-w-[200px] rounded-xl object-cover border border-border" />
              <button onClick={removeSource} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                <X className="h-3 w-3" />
              </button>
              {uploading && (
                <div className="absolute inset-0 bg-background/60 rounded-xl flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              )}
              {sourceGenId && (
                <span className="absolute bottom-2 left-2 text-[9px] bg-primary/80 text-primary-foreground px-1.5 py-0.5 rounded-full font-medium">
                  dari Gallery
                </span>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Inline gallery grid */}
              {galleryLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : galleryImages.length > 0 ? (
                <div>
                  <p className="text-[11px] text-muted-foreground mb-2">Pilih dari gallery terbaru:</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {galleryImages.map((img) => (
                      <button
                        key={img.id}
                        onClick={() => selectFromGallery(img)}
                        className="aspect-square rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors"
                      >
                        <img src={img.image_url!} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Upload fallback */}
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
                className="border-2 border-dashed border-border rounded-xl p-6 bg-background hover:border-primary/30 transition-colors flex flex-col items-center justify-center gap-1.5 cursor-pointer"
              >
                <Upload className="h-6 w-6 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Atau upload gambar baru</p>
                <p className="text-[10px] text-muted-foreground/60">JPEG, PNG, WebP — Maks 10MB</p>
              </div>
            </div>
          )}
        </div>

        {/* Content Template — "Gaya Konten" */}
        <div className="animate-fade-up" style={{ animationDelay: "150ms" }}>
          <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium block mb-2.5">
            Gaya Konten
          </label>
          {videoModel === "grok" && (
            <p className="text-[10px] text-muted-foreground/70 mb-2 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Grok maks 10 detik — template dipadatkan otomatis
            </p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CONTENT_TEMPLATES.map((t) => {
              const selected = selectedTemplate === t.key;
              const IconComp = ICON_MAP[t.icon] || Sparkles;
              const modelBadge = getModelBadge(t, videoModel);
              const recommended = isRecommendedForCategory(t, detectedCategory);

              return (
                <button
                  key={t.key}
                  onClick={() => { setSelectedTemplate(t.key); setPromptEnhanced(false); }}
                  className={`text-left rounded-xl p-3 transition-all ${
                    selected
                      ? "border-2 border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border border-border bg-card hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <IconComp className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-[11px] font-bold text-foreground leading-tight">{t.label}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">{t.desc}</p>
                  <div className="flex items-center gap-1 mt-2 flex-wrap">
                    {recommended && (
                      <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                        <Star className="h-2.5 w-2.5" /> Cocok
                      </span>
                    )}
                    {modelBadge.variant === "recommended" && (
                      <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full font-medium">
                        {modelBadge.label}
                      </span>
                    )}
                    {modelBadge.variant === "compact" && (
                      <span className="text-[9px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full font-medium">
                        {modelBadge.label}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dialogue Toggle + Script Builder */}
        <div className="animate-fade-up" style={{ animationDelay: "175ms" }}>
          <div className="flex items-center justify-between">
            <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Dialog</label>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">{withDialogue ? "Dengan Dialog" : "Tanpa Dialog"}</span>
              <Switch checked={withDialogue} onCheckedChange={(v) => { setWithDialogue(v); setPromptEnhanced(false); }} />
            </div>
          </div>
          {withDialogue && (
            <div className="mt-3 space-y-3">
              {/* Hook selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-medium text-muted-foreground">Hook:</span>
                  <button onClick={refreshHooks} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                    <Shuffle className="h-3 w-3" /> Acak
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {hookOptions.map((hook, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedHook(selectedHook === hook ? "" : hook)}
                      className={`text-[10px] px-2.5 py-1.5 rounded-full border transition-all leading-snug max-w-full text-left ${
                        selectedHook === hook
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border bg-card text-muted-foreground hover:border-muted-foreground/50"
                      }`}
                    >
                      {hook}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-medium text-muted-foreground">Body:</span>
                  <button onClick={refreshBodyScripts} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                    <Shuffle className="h-3 w-3" /> Acak
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {bodyOptions.map((body, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedBody(selectedBody === body ? "" : body)}
                      className={`text-[10px] px-2.5 py-1.5 rounded-full border transition-all leading-snug max-w-full text-left ${
                        selectedBody === body
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border bg-card text-muted-foreground hover:border-muted-foreground/50"
                      }`}
                    >
                      {body}
                    </button>
                  ))}
                </div>
              </div>

              {/* Combined preview textarea */}
              <Textarea
                value={dialogueText}
                onChange={(e) => { setDialogueText(e.target.value); setSelectedHook(""); setSelectedBody(""); setPromptEnhanced(false); }}
                rows={2}
                placeholder="Pilih hook + body di atas, atau tulis sendiri..."
                className="bg-muted/30 border-border text-xs"
              />

              {/* AI Generate Script button */}
              <button
                onClick={generateDialogScript}
                disabled={generatingScript}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors disabled:opacity-50"
              >
                {generatingScript ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                Generate Full Script AI
              </button>
            </div>
          )}
        </div>

        {/* Video Model */}
        <div className="animate-fade-up" style={{ animationDelay: "200ms" }}>
          <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium block mb-2.5">Video Model</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(["grok", "veo_fast", "veo_quality"] as VideoModel[]).map((m) => {
              const mi = MODEL_INFO[m];
              const selected = videoModel === m;
              return (
                <button
                  key={m}
                  onClick={() => { setVideoModel(m); setPromptEnhanced(false); }}
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
        <div className="animate-fade-up" style={{ animationDelay: "225ms" }}>
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
            placeholder="Opsional: deskripsikan konteks tambahan, atau biarkan kosong untuk auto-generate dari template..."
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
          <p className="text-[11px] text-muted-foreground/60 mt-1.5">
            Prompt akan di-enhance berdasarkan template "{getContentTemplate(selectedTemplate)?.label}"
            {sourceUrl && " + source image"}
          </p>
        </div>

        {/* TikTok Note */}
        <div className="animate-fade-up" style={{ animationDelay: "275ms" }}>
          <div className="flex items-start gap-2 bg-primary/10 border border-primary/20 rounded-lg p-3">
            <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              Ingat: Toggle &apos;AI-generated content&apos; saat upload ke TikTok. Konten AI yang dilabeli TIDAK akan dikurangi jangkauannya.
            </p>
          </div>
        </div>

        {/* Cost + Generate */}
        <div className="animate-fade-up" style={{ animationDelay: "300ms" }}>
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
            <p className="text-xs text-muted-foreground/60 mt-1">Pilih gambar, atur gaya konten, dan generate!</p>
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
              <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full">
                {getContentTemplate(selectedTemplate)?.label}
              </span>
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
