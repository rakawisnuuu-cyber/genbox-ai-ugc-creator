import { useState, useEffect, useCallback, useRef } from "react";
import { analyzeProduct, imageUrlToBase64, type ProductAnalysis } from "@/lib/product-analyzer";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Upload,
  Loader2,
  Sparkles,
  Volume2,
  VolumeX,
  Check,
  AlertTriangle,
  Film,
  GripVertical,
  Pause,
  Play,
  X,
  Download,
  Copy,
  RefreshCw,
  Clock,
  Zap,
  AlertCircle,
  Clapperboard,
  CheckCircle,
  MousePointerClick,
  ArrowRightLeft,
  Camera,
  Palette,
  MessageSquare,
  Eye,
  Sparkle,
  Package,
  HandMetal,
  Smartphone,
  BookOpen,
  Gem,
  BookMarked,
  Pencil,
  type LucideIcon,
} from "lucide-react";
import { useMultiShotGeneration } from "@/hooks/useMultiShotGeneration";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useApiKeys } from "@/hooks/useApiKeys";
import { usePromptModel } from "@/hooks/usePromptModel";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
  MODULE_LIBRARY,
  VIDEO_TEMPLATES,
  type ModuleType,
  type VideoModule,
  type VideoProject,
} from "@/lib/video-modules";

// Map icon string names to lucide components
const MODULE_ICONS: Record<string, LucideIcon> = {
  Zap, AlertCircle, Clapperboard, CheckCircle, MousePointerClick, ArrowRightLeft, Camera,
};
const TEMPLATE_ICONS: Record<string, LucideIcon> = {
  Smartphone, BookOpen, Gem, BookMarked,
};

const getModuleIcon = (iconName: string) => {
  const Icon = MODULE_ICONS[iconName];
  return Icon ? <Icon className="h-3 w-3" /> : null;
};

const getTemplateIcon = (iconName: string) => {
  const Icon = TEMPLATE_ICONS[iconName];
  return Icon ? <Icon className="h-6 w-6 text-muted-foreground" /> : null;
};

type VideoModel = "grok" | "veo_fast" | "veo_quality";
type Template = keyof typeof VIDEO_TEMPLATES | "custom";

const MODEL_INFO_MULTI: Record<VideoModel, { label: string; badge: string; badgeColor: string; audioInfo: string }> = {
  grok: { label: "Grok Imagine", badge: "HEMAT", badgeColor: "bg-green-500/20 text-green-400", audioInfo: "Audio & dialog native · 480-720p · ~17 detik" },
  veo_fast: { label: "Veo 3.1 Fast", badge: "STANDARD", badgeColor: "bg-blue-500/20 text-blue-400", audioInfo: "Audio & dialog native · 720-1080p · 15-30 detik" },
  veo_quality: { label: "Veo 3.1 Quality", badge: "PREMIUM", badgeColor: "bg-primary/20 text-primary", audioInfo: "Audio & dialog terbaik · Up to 4K · 1-2 menit" },
};

const SCRIPT_TEMPLATES = [
  { id: "testimony", icon: MessageSquare, label: "Testimony" },
  { id: "discovery", icon: Eye, label: "Discovery" },
  { id: "before_after", icon: Sparkle, label: "Before-After" },
  { id: "unboxing", icon: Package, label: "Unboxing" },
  { id: "casual", icon: HandMetal, label: "Casual Rec" },
];

const MultiShotCreator = () => {
  const { user } = useAuth();
  const { geminiKey, keys, kieApiKey } = useApiKeys();
  const { model: promptModel } = usePromptModel();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [projectId, setProjectId] = useState<string | null>(null);

  // Step 1 state
  const [template, setTemplate] = useState<Template>("ugc_ad");
  const [characterId, setCharacterId] = useState<string | null>(null);
  const [characters, setCharacters] = useState<any[]>([]);
  const [productImageUrl, setProductImageUrl] = useState<string | null>(null);
  const [productPreview, setProductPreview] = useState<string | null>(null);
  const [uploadingProduct, setUploadingProduct] = useState(false);
  const [productAnalysis, setProductAnalysis] = useState<ProductAnalysis | null>(null);
  const [analyzingProduct, setAnalyzingProduct] = useState(false);
  const [videoModel, setVideoModel] = useState<VideoModel>("veo_fast");
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "16:9">("9:16");
  const [withDialogue, setWithDialogue] = useState(true);

  // Step 2 state
  const [modules, setModules] = useState<VideoModule[]>([]);
  const [selectedModuleIdx, setSelectedModuleIdx] = useState(0);
  const [generatingPromptIdx, setGeneratingPromptIdx] = useState<number | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 2 drag-and-drop state
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Step 3 state
  const [showCostConfirm, setShowCostConfirm] = useState(true);
  const [previewShotIdx, setPreviewShotIdx] = useState<number | null>(null);
  const [generationStarted, setGenerationStarted] = useState(false);
  const [editingShotIdx, setEditingShotIdx] = useState<number | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [editDialogue, setEditDialogue] = useState("");
  const [regeneratingIdx, setRegeneratingIdx] = useState<number | null>(null);
  const [needsRestitch, setNeedsRestitch] = useState(false);
  const [deleteConfirmIdx, setDeleteConfirmIdx] = useState<number | null>(null);

  // Character info for generation
  const selectedChar = characters.find((c) => c.id === characterId);

  // Multi-shot generation hook
  const multiShotGen = useMultiShotGeneration({
    projectId: projectId || "",
    modules,
    characterHeroUrl: selectedChar?.hero_image_url || null,
    characterRefUrl: null,
    productImageUrl,
    model: videoModel,
    aspectRatio,
    kieApiKey: kieApiKey || "",
    geminiApiKey: geminiKey || "",
    promptModel,
    onModuleUpdate: (idx, patch) => {
      setModules((prev) => prev.map((m, i) => (i === idx ? { ...m, ...patch } : m)));
    },
    onProjectStatusChange: async (status) => {
      if (projectId) {
        await supabase.from("video_projects").update({ status, updated_at: new Date().toISOString() }).eq("id", projectId);
      }
    },
  });

  // Auto-select latest completed shot for preview
  useEffect(() => {
    if (multiShotGen.progress.completedShots.length > 0) {
      const latest = multiShotGen.progress.completedShots[multiShotGen.progress.completedShots.length - 1];
      setPreviewShotIdx(latest);
    }
  }, [multiShotGen.progress.completedShots]);

  const handleStartGeneration = () => {
    setShowCostConfirm(false);
    setGenerationStarted(true);
    multiShotGen.start();
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // Load characters
  useEffect(() => {
    if (!user) return;
    supabase
      .from("characters")
      .select("id, name, hero_image_url, description")
      .or(`user_id.eq.${user.id},is_preset.eq.true`)
      .order("created_at", { ascending: false })
      .then(({ data }) => setCharacters(data || []));
  }, [user]);

  // Product image upload
  const handleProductUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File terlalu besar", description: "Maksimal 10MB", variant: "destructive" });
      return;
    }
    setProductPreview(URL.createObjectURL(file));
    setUploadingProduct(true);
    const ext = file.name.split(".").pop();
    const path = `${user!.id}/video-sources/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) {
      toast({ title: "Upload gagal", variant: "destructive" });
      setUploadingProduct(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
    const publicUrl = urlData.publicUrl;
    setProductImageUrl(publicUrl);
    setUploadingProduct(false);

    // Auto-analyze product
    if (geminiKey && keys.gemini.status === "valid") {
      setAnalyzingProduct(true);
      try {
        const base64 = await imageUrlToBase64(publicUrl);
        const analysis = await analyzeProduct(base64, geminiKey, promptModel);
        setProductAnalysis(analysis);
        console.log("[multi-shot] Product analysis:", analysis);
      } catch (err) {
        console.error("Product analysis failed:", err);
      } finally {
        setAnalyzingProduct(false);
      }
    }
  };

  // Build modules from template
  const buildModules = (tmpl: Template): VideoModule[] => {
    if (tmpl === "custom") {
      return [
        makeModule("hook", 3, true),
        makeModule("demo", 5, false),
        makeModule("cta", 3, true),
      ];
    }
    const t = VIDEO_TEMPLATES[tmpl];
    return t.modules.map((m, i) =>
      makeModule(m.type, m.duration, withDialogue ? m.withDialogue : false)
    );
  };

  const makeModule = (type: ModuleType, duration: number, dialogue: boolean): VideoModule => {
    const lib = MODULE_LIBRARY[type];
    return {
      id: `mod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      duration,
      prompt: lib.promptStrategy,
      source: "character",
      video_url: null,
      thumbnail_url: null,
      status: "pending",
      withDialogue: dialogue,
      scriptTemplate: dialogue ? "discovery" : null,
      dialogueText: dialogue ? lib.exampleScript : null,
      audioDirection: lib.audioStrategy,
    };
  };

  // Step 1 → Step 2
  const goToStep2 = async () => {
    if (!user) return;
    const mods = buildModules(template);
    setModules(mods);
    setSelectedModuleIdx(0);

    const totalDur = mods.reduce((s, m) => s + m.duration, 0);
    const { data, error } = await supabase
      .from("video_projects")
      .insert({
        user_id: user.id,
        template: template === "custom" ? "custom" : template,
        character_id: characterId,
        product_image_url: productImageUrl,
        model: videoModel === "grok" ? "grok" : videoModel === "veo_fast" ? "veo3_fast" : "veo3",
        aspect_ratio: aspectRatio,
        with_dialogue: withDialogue,
        modules: mods as any,
        total_duration: totalDur,
        status: "draft",
      })
      .select("id")
      .single();

    if (error) {
      toast({ title: "Gagal menyimpan project", variant: "destructive" });
      console.error(error);
      return;
    }
    setProjectId(data.id);
    setStep(2);
  };

  // Debounced save modules
  const saveModules = useCallback(
    (mods: VideoModule[]) => {
      if (!projectId) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        const totalDur = mods.reduce((s, m) => s + m.duration, 0);
        await supabase
          .from("video_projects")
          .update({ modules: mods as any, total_duration: totalDur, updated_at: new Date().toISOString() })
          .eq("id", projectId);
      }, 2000);
    },
    [projectId]
  );

  const updateModule = (idx: number, patch: Partial<VideoModule>) => {
    setModules((prev) => {
      const next = prev.map((m, i) => (i === idx ? { ...m, ...patch } : m));
      saveModules(next);
      return next;
    });
  };

  // Add module
  const addModule = (afterIdx: number, type: ModuleType) => {
    if (modules.length >= 7) return;
    const newMod = makeModule(type, MODULE_LIBRARY[type].defaultDuration, withDialogue ? MODULE_LIBRARY[type].defaultDialogue : false);
    setModules((prev) => {
      const next = [...prev];
      next.splice(afterIdx + 1, 0, newMod);
      saveModules(next);
      return next;
    });
    setSelectedModuleIdx(afterIdx + 1);
  };

  // Remove module with validation
  const removeModule = (idx: number) => {
    if (modules.length <= 3) {
      toast({ title: "Minimum 3 module diperlukan", variant: "destructive" });
      return;
    }
    const mod = modules[idx];
    if (mod.type === "hook" && idx === 0) {
      toast({ title: "Video harus dimulai dengan Hook", variant: "destructive" });
      return;
    }
    if (mod.type === "cta" && idx === modules.length - 1) {
      toast({ title: "Video harus diakhiri dengan CTA", variant: "destructive" });
      return;
    }
    setDeleteConfirmIdx(null);
    setModules((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      saveModules(next);
      return next;
    });
    setSelectedModuleIdx((prev) => Math.min(prev, modules.length - 2));
  };

  // Drag-and-drop reorder
  const handleDragStart = (idx: number) => {
    setDragIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };

  const handleDrop = (targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }
    
    const draggedMod = modules[dragIdx];
    const targetMod = modules[targetIdx];
    
    // Hook must stay first
    if (draggedMod.type === "hook" && targetIdx !== 0) {
      toast({ title: "Hook harus tetap di posisi pertama", variant: "destructive" });
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }
    if (targetIdx === 0 && draggedMod.type !== "hook" && modules[0].type === "hook") {
      toast({ title: "Hook harus tetap di posisi pertama", variant: "destructive" });
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }
    // CTA must stay last
    if (draggedMod.type === "cta" && targetIdx !== modules.length - 1) {
      toast({ title: "CTA harus tetap di posisi terakhir", variant: "destructive" });
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }
    if (targetIdx === modules.length - 1 && draggedMod.type !== "cta" && modules[modules.length - 1].type === "cta") {
      toast({ title: "CTA harus tetap di posisi terakhir", variant: "destructive" });
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }
    
    setModules((prev) => {
      const next = [...prev];
      const [removed] = next.splice(dragIdx, 1);
      next.splice(targetIdx, 0, removed);
      saveModules(next);
      return next;
    });
    setSelectedModuleIdx(targetIdx);
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    setDragIdx(null);
    setDragOverIdx(null);
  };

  // Step 3: Regenerate single shot
  const handleRegenerateShot = async (idx: number) => {
    setRegeneratingIdx(idx);
    try {
      await multiShotGen.retryShot(idx);
      setNeedsRestitch(true);
      sonnerToast.success(`Shot #${idx + 1} berhasil di-regenerate`);
    } catch {
      sonnerToast.error(`Gagal regenerate shot #${idx + 1}`);
    } finally {
      setRegeneratingIdx(null);
    }
  };

  // Step 3: Save edited prompt & regenerate
  const handleSaveAndRegenerate = async (idx: number) => {
    updateModule(idx, { prompt: editPrompt, dialogueText: editDialogue || null });
    setEditingShotIdx(null);
    setRegeneratingIdx(idx);
    try {
      // Update module first, then retry
      setTimeout(() => multiShotGen.retryShot(idx), 100);
      setNeedsRestitch(true);
    } catch {
      sonnerToast.error(`Gagal regenerate shot #${idx + 1}`);
    } finally {
      setTimeout(() => setRegeneratingIdx(null), 500);
    }
  };

  // Generate prompt for module
  const generateModulePrompt = async (idx: number) => {
    if (!geminiKey || keys.gemini.status !== "valid") {
      toast({ title: "Gemini API key belum di-setup", variant: "destructive" });
      return;
    }
    const mod = modules[idx];
    const lib = MODULE_LIBRARY[mod.type];
    const char = characters.find((c) => c.id === characterId);
    setGeneratingPromptIdx(idx);
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${promptModel}:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{
                text: `You are an expert TikTok video prompt builder. Generate a motion-focused English prompt for a ${mod.type} shot in a UGC-style TikTok video. The video features ${char?.description || "a person"}. This is shot #${idx + 1} of ${modules.length}. Duration: ${mod.duration} seconds. Focus on: ${lib.promptStrategy}. Keep under 60 words. Describe MOTION and ACTION only. Replace any placeholders with actual content. Respond with just the prompt.`,
              }],
            },
            contents: [{ parts: [{ text: `Generate a ${mod.type} video prompt.` }] }],
          }),
        }
      );
      const json = await res.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
      if (text) updateModule(idx, { prompt: text });
    } catch {
      toast({ title: "Gagal generate prompt", variant: "destructive" });
    } finally {
      setGeneratingPromptIdx(null);
    }
  };

  // Validation
  const totalDuration = modules.reduce((s, m) => s + m.duration, 0);
  const validationErrors: string[] = [];
  if (modules.length > 0) {
    if (modules[0].type !== "hook") validationErrors.push("Module pertama harus Hook");
    if (modules[modules.length - 1].type !== "cta") validationErrors.push("Module terakhir harus CTA");
    if (modules.length < 3) validationErrors.push("Minimum 3 module");
    if (modules.length > 7) validationErrors.push("Maksimum 7 module");
    if (totalDuration < 10) validationErrors.push("Durasi minimum 10 detik");
    if (totalDuration > 60) validationErrors.push("Durasi maksimum 60 detik");
  }
  const isStep2Valid = validationErrors.length === 0 && modules.length >= 3;

  const selectedModule = modules[selectedModuleIdx] || null;

  // Module type picker state
  const [addMenuIdx, setAddMenuIdx] = useState<number | null>(null);

  return (
    <div className="space-y-6 px-4 lg:px-6 py-6 lg:py-8">
      {/* Stepper */}
      <div className="flex items-center gap-2 justify-center">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <button
              onClick={() => s < step && setStep(s)}
              disabled={s > step}
              className={`h-8 w-8 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${
                s === step
                  ? "bg-primary text-primary-foreground"
                  : s < step
                  ? "bg-primary/20 text-primary cursor-pointer hover:bg-primary/30"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {s < step ? <Check className="h-4 w-4" /> : s}
            </button>
            <span className={`text-xs hidden sm:inline ${s === step ? "text-foreground font-medium" : "text-muted-foreground"}`}>
              {s === 1 ? "Pilih Template" : s === 2 ? "Atur Module" : "Generate & Preview"}
            </span>
            {s < 3 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <div className="space-y-6 max-w-4xl mx-auto animate-fade-up">
          {/* Template Grid */}
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium block mb-3">Template Video</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.entries(VIDEO_TEMPLATES) as [string, typeof VIDEO_TEMPLATES.ugc_ad][]).map(([key, tmpl]) => {
                const selected = template === key;
                return (
                  <button
                    key={key}
                    onClick={() => setTemplate(key as Template)}
                    className={`text-left rounded-xl p-4 transition-all ${
                      selected
                        ? "border-2 border-primary shadow-[0_0_20px_-5px_hsl(var(--primary)/0.2)]"
                        : "border border-border hover:border-muted-foreground/30"
                    } bg-card`}
                  >
                    <div className="flex items-start justify-between">
                      {getTemplateIcon(tmpl.icon)}
                      <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{tmpl.duration}</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground mt-2">{tmpl.nameId}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{tmpl.descriptionId}</p>
                    <p className="text-[11px] text-muted-foreground/60 mt-1">{tmpl.modules.length} shots</p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {tmpl.modules.map((m, i) => (
                        <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded-full border inline-flex items-center gap-0.5 ${MODULE_LIBRARY[m.type].color}`}>
                          {getModuleIcon(MODULE_LIBRARY[m.type].icon)}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
              {/* Custom */}
              <button
                onClick={() => setTemplate("custom")}
                className={`text-left rounded-xl p-4 transition-all ${
                  template === "custom"
                    ? "border-2 border-primary shadow-[0_0_20px_-5px_hsl(var(--primary)/0.2)]"
                    : "border-2 border-dashed border-border hover:border-muted-foreground/30"
                } bg-card`}
              >
                <Palette className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground mt-2">Custom</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Buat sendiri dari nol</p>
              </button>
            </div>
          </div>

          {/* Character */}
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium block mb-2.5">Karakter</label>
            <select
              value={characterId || ""}
              onChange={(e) => setCharacterId(e.target.value || null)}
              className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground"
            >
              <option value="">— Pilih karakter (opsional) —</option>
              {characters.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Product Image */}
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium block mb-2.5">Gambar Produk</label>
            {productPreview ? (
              <div className="relative inline-block">
                <img src={productPreview} alt="Product" className="max-w-[160px] rounded-xl border border-border" />
                <button
                  onClick={() => { setProductPreview(null); setProductImageUrl(null); }}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                >
                  <span className="text-xs">✕</span>
                </button>
                {uploadingProduct && (
                  <div className="absolute inset-0 bg-background/60 rounded-xl flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
              </div>
            ) : (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleProductUpload(f); }}
                onClick={() => {
                  const inp = document.createElement("input");
                  inp.type = "file";
                  inp.accept = "image/jpeg,image/png,image/webp";
                  inp.onchange = (ev) => { const f = (ev.target as HTMLInputElement).files?.[0]; if (f) handleProductUpload(f); };
                  inp.click();
                }}
                className="border-2 border-dashed border-border rounded-xl p-6 bg-background hover:border-primary/30 transition-colors flex flex-col items-center gap-2 cursor-pointer"
              >
                <Upload className="h-6 w-6 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Upload gambar produk (opsional)</p>
              </div>
            )}
            {/* Product Analysis Card */}
            {analyzingProduct && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                Menganalisis produk...
              </div>
            )}
            {productAnalysis && !analyzingProduct && productPreview && (
              <div className="mt-3 p-3 bg-card border border-border rounded-lg space-y-1.5">
                <p className="text-xs font-medium text-primary">{productAnalysis.product_name}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                  {productAnalysis.product_visual}
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {productAnalysis.product_features.split(",").slice(0, 4).map((f, i) => (
                    <span key={i} className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
                      {f.trim()}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-[10px] text-muted-foreground/60">Setting: {productAnalysis.video_setting}</span>
                  <span className="text-[10px] text-muted-foreground/60">ICP: {productAnalysis.icp}</span>
                </div>
                {!characterId && productAnalysis.character_model && (
                  <p className="text-[10px] text-primary/70 mt-1">💡 Rekomendasi karakter: {productAnalysis.character_model}</p>
                )}
              </div>
            )}
          </div>

          {/* Model */}
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium block mb-2.5">Video Model</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(["grok", "veo_fast", "veo_quality"] as VideoModel[]).map((m) => {
                const mi = MODEL_INFO_MULTI[m];
                const selected = videoModel === m;
                return (
                  <button
                    key={m}
                    onClick={() => setVideoModel(m)}
                    className={`text-left rounded-xl p-3.5 transition-colors ${
                      selected ? "border-2 border-primary bg-primary/5" : "border border-border bg-card hover:border-muted-foreground/30"
                    }`}
                  >
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${mi.badgeColor}`}>{mi.badge}</span>
                    <p className="text-sm font-semibold text-foreground mt-2">{mi.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{mi.audioInfo}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium block mb-2.5">Aspect Ratio</label>
            <div className="flex gap-2">
              {(["9:16", "16:9"] as const).map((ar) => (
                <button
                  key={ar}
                  onClick={() => setAspectRatio(ar)}
                  className={`text-xs px-4 py-2 rounded-lg transition-colors ${
                    aspectRatio === ar ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {ar === "9:16" ? "9:16 Portrait" : "16:9 Landscape"}
                </button>
              ))}
            </div>
          </div>

          {/* Audio Mode */}
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium block mb-2.5">Audio Mode</label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setWithDialogue(true)}
                className={`text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors ${
                  withDialogue ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <Volume2 className="h-3.5 w-3.5" /> Dengan Dialog & Audio
              </button>
              <button
                onClick={() => setWithDialogue(false)}
                className={`text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors ${
                  !withDialogue ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <VolumeX className="h-3.5 w-3.5" /> Audio Ambient Saja
              </button>
            </div>
          </div>

          {/* Next */}
          <div className="flex justify-end pt-4">
            <button
              onClick={goToStep2}
              className="bg-primary text-primary-foreground font-bold text-sm px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors"
            >
              Selanjutnya <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto animate-fade-up">
          {/* Left — Timeline */}
          <div className="w-full lg:w-[60%] space-y-0">
            <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium block mb-3">Module Timeline</label>
            <div className="space-y-0 relative">
              {modules.map((mod, idx) => {
                const lib = MODULE_LIBRARY[mod.type];
                const isSelected = idx === selectedModuleIdx;
                const isDragOver = dragOverIdx === idx && dragIdx !== idx;
                return (
                  <div key={mod.id}>
                    {/* Drop indicator line */}
                    {isDragOver && dragIdx !== null && dragIdx > idx && (
                      <div className="h-0.5 bg-primary rounded-full mx-4 my-0.5 transition-all" />
                    )}
                    {/* Module card with drag */}
                    <div
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={() => handleDrop(idx)}
                      onDragEnd={handleDragEnd}
                      onClick={() => setSelectedModuleIdx(idx)}
                      className={`w-full text-left rounded-xl p-3.5 transition-all relative group cursor-pointer ${
                        isSelected
                          ? "border-2 border-primary bg-primary/5 shadow-[0_0_15px_-5px_hsl(var(--primary)/0.15)]"
                          : "border border-border bg-card hover:border-muted-foreground/30"
                      } ${dragIdx === idx ? "opacity-40" : ""}`}
                    >
                      <div className="flex items-center gap-2">
                        {/* Drag handle */}
                        <GripVertical className="h-4 w-4 text-muted-foreground/30 shrink-0 cursor-grab active:cursor-grabbing group-hover:text-muted-foreground transition-colors" />
                        {/* Colored bar */}
                        <div className={`w-1 h-10 rounded-full shrink-0 ${lib.color.split(" ")[0]}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] text-muted-foreground font-mono">#{idx + 1}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${lib.color}`}>
                              {getModuleIcon(lib.icon)} {lib.label}
                            </span>
                            <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">{mod.duration}s</span>
                            {mod.withDialogue ? (
                              <Volume2 className="h-3 w-3 text-primary" />
                            ) : (
                              <VolumeX className="h-3 w-3 text-muted-foreground/50" />
                            )}
                            <span className={`h-2 w-2 rounded-full ${
                              mod.status === "completed" ? "bg-green-500" :
                              mod.status === "generating" ? "bg-yellow-500 animate-pulse" :
                              mod.status === "failed" ? "bg-destructive" :
                              "bg-muted-foreground/30"
                            }`} />
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1 truncate">{mod.prompt.slice(0, 60)}...</p>
                        </div>
                        {/* Delete button on hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          {deleteConfirmIdx === idx ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); removeModule(idx); }}
                                className="text-[10px] text-destructive-foreground bg-destructive px-2 py-1 rounded"
                              >
                                Hapus
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setDeleteConfirmIdx(null); }}
                                className="text-[10px] text-muted-foreground px-1 py-1"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirmIdx(idx); }}
                              className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              title={`Hapus module ${lib.label}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Drop indicator line */}
                    {isDragOver && dragIdx !== null && dragIdx < idx && (
                      <div className="h-0.5 bg-primary rounded-full mx-4 my-0.5 transition-all" />
                    )}

                    {/* Add button between modules */}
                    {idx < modules.length - 1 && modules.length < 7 && (
                      <div className="flex items-center justify-center py-1 relative">
                        <div className="h-4 w-px bg-border" />
                        <div className="absolute">
                          <button
                            onClick={() => setAddMenuIdx(addMenuIdx === idx ? null : idx)}
                            className="h-5 w-5 rounded-full bg-muted border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          {addMenuIdx === idx && (
                            <div className="absolute left-1/2 -translate-x-1/2 top-6 z-20 bg-card border border-border rounded-lg shadow-lg p-1.5 min-w-[180px]">
                              {(Object.entries(MODULE_LIBRARY) as [ModuleType, typeof MODULE_LIBRARY.hook][]).map(([type, lib]) => (
                                <button
                                  key={type}
                                  onClick={() => { addModule(idx, type); setAddMenuIdx(null); }}
                                  className="w-full text-left text-xs px-3 py-2 rounded-md hover:bg-muted flex items-center gap-2 transition-colors"
                                >
                                  <span>{getModuleIcon(lib.icon)}</span>
                                  <span className="font-medium">{lib.label}</span>
                                  <span className="text-muted-foreground ml-auto">{lib.defaultDuration}s</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Summary + validation */}
            <div className="mt-4 pt-4 border-t border-border space-y-2">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{modules.length} module</span>
                <span>•</span>
                <span>{totalDuration} detik total</span>
              </div>
              {validationErrors.length > 0 && (
                <div className="space-y-1">
                  {validationErrors.map((err, i) => (
                    <p key={i} className="text-[11px] text-destructive flex items-center gap-1.5">
                      <AlertTriangle className="h-3 w-3 shrink-0" /> {err}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right — Module Config */}
          <div className="w-full lg:w-[40%]">
            {selectedModule ? (
              <div className="bg-card border border-border rounded-xl p-5 space-y-5 sticky top-4">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border inline-flex items-center gap-1 ${MODULE_LIBRARY[selectedModule.type].color}`}>
                    {getModuleIcon(MODULE_LIBRARY[selectedModule.type].icon)} {MODULE_LIBRARY[selectedModule.type].label}
                  </span>
                  <span className="text-[11px] text-muted-foreground">#{selectedModuleIdx + 1}</span>
                </div>

                {/* Duration */}
                <div>
                  <label className="text-[11px] uppercase tracking-widest text-muted-foreground block mb-2">
                    Durasi: {selectedModule.duration} detik
                  </label>
                  {videoModel === "grok" ? (
                    <div className="space-y-2">
                      <RadioGroup
                        value={String(selectedModule.duration <= 7 ? 6 : 10)}
                        onValueChange={(v) => updateModule(selectedModuleIdx, { duration: Number(v) })}
                        className="flex gap-3"
                      >
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                          <RadioGroupItem value="6" /> 6 detik
                        </label>
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                          <RadioGroupItem value="10" /> 10 detik
                        </label>
                      </RadioGroup>
                      <p className="text-[10px] text-muted-foreground/60">Grok mendukung durasi 6 atau 10 detik saja</p>
                    </div>
                  ) : (
                    <Slider
                      value={[selectedModule.duration]}
                      onValueChange={([v]) => updateModule(selectedModuleIdx, { duration: v })}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                  )}
                </div>

                {/* Source */}
                <div>
                  <label className="text-[11px] uppercase tracking-widest text-muted-foreground block mb-2">Source</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["character", "product", "custom", "text_only"] as const).map((src) => (
                      <button
                        key={src}
                        onClick={() => updateModule(selectedModuleIdx, { source: src })}
                        className={`text-xs px-3 py-2 rounded-lg transition-colors ${
                          selectedModule.source === src
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {src === "character" ? "Karakter" : src === "product" ? "Produk" : src === "custom" ? "Upload" : "Teks saja"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prompt */}
                <div>
                  <label className="text-[11px] uppercase tracking-widest text-muted-foreground block mb-2">Prompt</label>
                  <Textarea
                    value={selectedModule.prompt}
                    onChange={(e) => updateModule(selectedModuleIdx, { prompt: e.target.value })}
                    rows={6}
                    className="bg-muted/30 border-border text-xs"
                  />
                  <button
                    onClick={() => generateModulePrompt(selectedModuleIdx)}
                    disabled={generatingPromptIdx !== null}
                    className="mt-2 text-xs border border-primary text-primary px-3 py-1.5 rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {generatingPromptIdx === selectedModuleIdx ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    Generate Prompt
                  </button>
                </div>

                {/* Audio & Dialog */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Audio & Dialog</label>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">{selectedModule.withDialogue ? "Dengan Dialog" : "Tanpa Dialog"}</span>
                      <Switch
                        checked={selectedModule.withDialogue}
                        onCheckedChange={(v) => updateModule(selectedModuleIdx, { withDialogue: v })}
                      />
                    </div>
                  </div>

                  {selectedModule.withDialogue ? (
                    <div className="space-y-3">
                      {/* Script templates */}
                      <div className="flex gap-1.5 flex-wrap overflow-x-auto snap-x">
                        {SCRIPT_TEMPLATES.map((st) => (
                          <button
                            key={st.id}
                            onClick={() => updateModule(selectedModuleIdx, { scriptTemplate: st.id })}
                            className={`text-[10px] px-2.5 py-1.5 rounded-lg border whitespace-nowrap snap-start transition-colors ${
                              selectedModule.scriptTemplate === st.id
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border text-muted-foreground hover:border-muted-foreground/50"
                            }`}
                          >
                            <st.icon className="h-3 w-3" /> {st.label}
                          </button>
                        ))}
                      </div>
                      <Textarea
                        value={selectedModule.dialogueText || ""}
                        onChange={(e) => updateModule(selectedModuleIdx, { dialogueText: e.target.value })}
                        rows={2}
                        placeholder="Tulis dialog yang akan diucapkan..."
                        className="bg-muted/30 border-border text-xs"
                      />
                      <p className="text-[10px] text-muted-foreground/60">Dialog akan diucapkan oleh karakter dalam video</p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground/60">Audio: ambient sounds only</p>
                  )}

                  {/* CTA warning */}
                  {selectedModule.type === "cta" && !selectedModule.withDialogue && (
                    <p className="text-[10px] text-yellow-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> CTA biasanya butuh dialog untuk mengarahkan penonton
                    </p>
                  )}
                  {(selectedModule.type === "transition" || selectedModule.type === "broll") && (
                    <p className="text-[10px] text-muted-foreground/60">Module ini biasanya tanpa dialog</p>
                  )}
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeModule(selectedModuleIdx)}
                  disabled={modules.length <= 3}
                  className="w-full text-xs text-destructive border border-destructive/30 py-2 rounded-lg hover:bg-destructive/10 transition-colors disabled:opacity-30 flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="h-3 w-3" /> Hapus Module
                </button>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl p-8 flex flex-col items-center text-center">
                <Film className="h-10 w-10 text-muted-foreground/20 mb-2" />
                <p className="text-sm text-muted-foreground">Pilih module dari timeline</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: Generate & Preview */}
      {step === 3 && (
        <div className="max-w-6xl mx-auto animate-fade-up">
          {/* Cost confirmation */}
          {showCostConfirm && !generationStarted && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
              <Film className="h-12 w-12 text-primary/40" />
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-foreground">Estimasi Biaya</h3>
                <p className="text-sm text-muted-foreground">
                  {modules.length} shots × Rp {multiShotGen.costPerShot.toLocaleString("id-ID")} ={" "}
                  <span className="text-foreground font-bold">Rp {multiShotGen.totalCost.toLocaleString("id-ID")}</span>
                </p>
                <p className="text-xs text-muted-foreground/60">Semua shots termasuk audio native</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="text-sm text-muted-foreground px-4 py-2.5 rounded-lg hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 inline mr-1" /> Kembali
                </button>
                <button
                  onClick={handleStartGeneration}
                  disabled={!kieApiKey || keys.kie_ai.status !== "valid"}
                  className="bg-primary text-primary-foreground font-bold text-sm px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40 flex items-center gap-2"
                >
                  <Play className="h-4 w-4" /> Mulai Generate
                </button>
              </div>
              {(!kieApiKey || keys.kie_ai.status !== "valid") && (
                <p className="text-xs text-destructive">Kie AI API key belum di-setup. Buka Settings.</p>
              )}
            </div>
          )}

          {/* Generation in progress / completed */}
          {generationStarted && (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left — Progress Tracker */}
              <div className="w-full lg:w-[55%] space-y-4">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium block">Generation Progress</label>

                <div className="space-y-2">
                  {modules.map((mod, idx) => {
                    const lib = MODULE_LIBRARY[mod.type];
                    const isActive = (multiShotGen.progress.currentShot === idx && mod.status === "generating") || regeneratingIdx === idx;
                    const isCompleted = mod.status === "completed" && regeneratingIdx !== idx;
                    const isFailed = mod.status === "failed" && regeneratingIdx !== idx;
                    const shotElapsed = multiShotGen.progress.elapsedPerShot[idx] || 0;
                    const isEditing = editingShotIdx === idx;

                    return (
                      <div
                        key={mod.id}
                        className={`rounded-xl transition-all border ${
                          isActive
                            ? "border-primary/50 bg-primary/5 animate-pulse"
                            : isCompleted
                            ? "border-green-500/30 bg-green-500/5"
                            : isFailed
                            ? "border-destructive/30 bg-destructive/5"
                            : "border-border bg-card"
                        }`}
                      >
                        <div className="p-3.5">
                          <div className="flex items-center gap-3 group">
                            <div className={`w-1 h-10 rounded-full shrink-0 ${
                              isCompleted ? "bg-green-500" : isFailed ? "bg-destructive" : isActive ? "bg-primary" : lib.color.split(" ")[0]
                            }`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[11px] text-muted-foreground font-mono">#{idx + 1}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${lib.color}`}>
                                  {getModuleIcon(lib.icon)} {lib.label}
                                </span>
                                {mod.withDialogue && <Volume2 className="h-3 w-3 text-primary" />}

                                {/* Status */}
                                {isActive && (
                                  <span className="text-[10px] text-primary flex items-center gap-1">
                                    <Loader2 className="h-3 w-3 animate-spin" /> Generating... {formatTime(shotElapsed)}
                                  </span>
                                )}
                                {isCompleted && (
                                  <span className="text-[10px] text-green-500 flex items-center gap-1">
                                    <Check className="h-3 w-3" /> Selesai
                                  </span>
                                )}
                                {isFailed && (
                                  <span className="text-[10px] text-destructive flex items-center gap-1">
                                    <X className="h-3 w-3" /> Gagal
                                    {mod.error_message && (
                                      <span className="text-destructive/70 ml-1">— {mod.error_message}</span>
                                    )}
                                  </span>
                                )}
                                {!isActive && !isCompleted && !isFailed && (
                                  <span className="text-[10px] text-muted-foreground/50 flex items-center gap-1"><Clock className="h-3 w-3" /> Menunggu...</span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {isCompleted && mod.video_url && (
                                  <button
                                    onClick={() => setPreviewShotIdx(idx)}
                                    className="text-[10px] text-primary hover:underline"
                                  >
                                    <Play className="h-3 w-3 inline mr-0.5" /> Preview
                                  </button>
                                )}
                                {isFailed && (
                                  <button
                                    onClick={() => handleRegenerateShot(idx)}
                                    className="text-[10px] text-destructive hover:underline flex items-center gap-1"
                                  >
                                    <RefreshCw className="h-3 w-3" /> Coba Lagi
                                  </button>
                                )}
                                {/* Regenerate & Edit buttons on completed shots */}
                                {isCompleted && (
                                  <>
                                    <button
                                      onClick={() => handleRegenerateShot(idx)}
                                      className="text-[10px] text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1"
                                    >
                                      <RefreshCw className="h-3 w-3" /> Regenerate
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingShotIdx(isEditing ? null : idx);
                                        setEditPrompt(mod.prompt);
                                        setEditDialogue(mod.dialogueText || "");
                                      }}
                                      className="text-[10px] text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1"
                                    >
                                      <Pencil className="h-3 w-3" /> Edit Prompt
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expandable prompt editor */}
                        {isEditing && (
                          <div className="border-t border-border p-3.5 space-y-3 animate-fade-up">
                            <div>
                              <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Prompt</label>
                              <Textarea
                                value={editPrompt}
                                onChange={(e) => setEditPrompt(e.target.value)}
                                rows={4}
                                className="bg-muted/30 border-border text-xs"
                              />
                            </div>
                            {mod.withDialogue && (
                              <div>
                                <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Dialog</label>
                                <Textarea
                                  value={editDialogue}
                                  onChange={(e) => setEditDialogue(e.target.value)}
                                  rows={2}
                                  placeholder="Dialog karakter..."
                                  className="bg-muted/30 border-border text-xs"
                                />
                              </div>
                            )}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveAndRegenerate(idx)}
                                className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                              >
                                <Sparkles className="h-3 w-3" /> Save & Regenerate
                              </button>
                              <button
                                onClick={() => setEditingShotIdx(null)}
                                className="text-xs text-muted-foreground px-3 py-1.5 rounded-lg hover:text-foreground transition-colors"
                              >
                                Batal
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Restitch warning */}
                        {needsRestitch && isCompleted && idx === modules.length - 1 && (
                          <div className="border-t border-border px-3.5 py-2">
                            <p className="text-[10px] text-yellow-500 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Re-stitching diperlukan setelah regenerate
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Overall progress */}
                <div className="space-y-3 pt-2 border-t border-border">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{multiShotGen.progress.completedShots.length} / {modules.length} shots selesai</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatTime(multiShotGen.progress.totalElapsed)}</span>
                  </div>
                  <Progress value={(multiShotGen.progress.completedShots.length / modules.length) * 100} className="h-2" />

                  {/* Controls */}
                  {multiShotGen.progress.status === "generating" && (
                    <div className="flex gap-2">
                      <button
                        onClick={multiShotGen.pause}
                        className="text-xs bg-muted text-muted-foreground px-3 py-2 rounded-lg hover:bg-muted/80 flex items-center gap-1.5 transition-colors"
                      >
                        <Pause className="h-3 w-3" /> Pause
                      </button>
                      <button
                        onClick={multiShotGen.cancel}
                        className="text-xs text-destructive border border-destructive/30 px-3 py-2 rounded-lg hover:bg-destructive/10 flex items-center gap-1.5 transition-colors"
                      >
                        <X className="h-3 w-3" /> Batalkan Semua
                      </button>
                    </div>
                  )}
                  {multiShotGen.progress.status === "paused" && (
                    <div className="flex gap-2">
                      <button
                        onClick={multiShotGen.resume}
                        className="text-xs bg-primary text-primary-foreground px-3 py-2 rounded-lg hover:bg-primary/90 flex items-center gap-1.5 transition-colors"
                      >
                        <Play className="h-3 w-3" /> Lanjutkan
                      </button>
                      <button
                        onClick={multiShotGen.cancel}
                        className="text-xs text-destructive border border-destructive/30 px-3 py-2 rounded-lg hover:bg-destructive/10 flex items-center gap-1.5 transition-colors"
                      >
                        <X className="h-3 w-3" /> Batalkan
                      </button>
                    </div>
                  )}
                  {multiShotGen.progress.status === "completed" && (
                    <div className="text-center py-2">
                      <p className="text-sm font-semibold text-green-500 flex items-center justify-center gap-1"><CheckCircle className="h-4 w-4" /> Semua shot selesai!</p>
                      {multiShotGen.progress.failedShots.length > 0 && (
                        <p className="text-xs text-destructive mt-1">{multiShotGen.progress.failedShots.length} shot gagal — retry di atas</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right — Live Preview */}
              <div className="w-full lg:w-[45%]">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium block mb-3">Preview</label>
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  {previewShotIdx !== null && modules[previewShotIdx]?.video_url ? (
                    <div>
                      <div className={`relative bg-black ${aspectRatio === "9:16" ? "aspect-[9/16] max-h-[50vh]" : "aspect-video"} mx-auto`}>
                        <video
                          key={modules[previewShotIdx].video_url}
                          src={modules[previewShotIdx].video_url!}
                          className="w-full h-full object-contain"
                          controls
                          autoPlay
                          loop
                          playsInline
                        />
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${MODULE_LIBRARY[modules[previewShotIdx].type].color}`}>
                            {getModuleIcon(MODULE_LIBRARY[modules[previewShotIdx].type].icon)} Shot #{previewShotIdx + 1}
                          </span>
                          {modules[previewShotIdx].withDialogue && (
                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full inline-flex items-center gap-1"><Volume2 className="h-3 w-3" /> Audio native</span>
                          )}
                        </div>
                        <a
                          href={modules[previewShotIdx].video_url!}
                          download={`shot-${previewShotIdx + 1}.mp4`}
                          className="text-xs bg-primary text-primary-foreground px-3 py-2 rounded-lg inline-flex items-center gap-1.5 hover:bg-primary/90 transition-colors"
                        >
                          <Download className="h-3 w-3" /> Download Shot
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      {multiShotGen.progress.status === "generating" ? (
                        <>
                          <Loader2 className="h-10 w-10 text-primary/30 animate-spin mb-3" />
                          <p className="text-sm text-muted-foreground">
                            Generating shot {multiShotGen.progress.currentShot + 1}...
                          </p>
                          <p className="text-[10px] text-muted-foreground/50 mt-1 flex items-center justify-center gap-1">
                            {getModuleIcon(MODULE_LIBRARY[modules[multiShotGen.progress.currentShot]?.type]?.icon)}
                            {MODULE_LIBRARY[modules[multiShotGen.progress.currentShot]?.type]?.label}
                          </p>
                        </>
                      ) : (
                        <>
                          <Film className="h-10 w-10 text-muted-foreground/20 mb-3" />
                          <p className="text-sm text-muted-foreground">Preview akan muncul di sini</p>
                        </>
                      )}
                    </div>
                  )}

                  {/* Completed shots thumbnail strip */}
                  {multiShotGen.progress.completedShots.length > 1 && (
                    <div className="border-t border-border p-3">
                      <div className="flex gap-2 overflow-x-auto">
                        {multiShotGen.progress.completedShots.map((shotIdx) => (
                          <button
                            key={shotIdx}
                            onClick={() => setPreviewShotIdx(shotIdx)}
                            className={`shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                              previewShotIdx === shotIdx ? "border-primary" : "border-transparent hover:border-muted-foreground/30"
                            }`}
                          >
                            <div className="w-16 h-16 bg-black relative">
                              <video
                                src={modules[shotIdx]?.video_url || ""}
                                className="w-full h-full object-cover"
                                muted
                                playsInline
                                onLoadedData={(e) => { (e.target as HTMLVideoElement).currentTime = 0.1; }}
                              />
                              <span className="absolute bottom-0.5 right-0.5 text-[8px] bg-black/70 text-white px-1 rounded">
                                #{shotIdx + 1}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation (Step 2) */}
      {step === 2 && (
        <div className="flex justify-between max-w-6xl mx-auto pt-4">
          <button
            onClick={() => setStep(1)}
            className="text-sm text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Kembali
          </button>
          <button
            onClick={() => { setShowCostConfirm(true); setGenerationStarted(false); setStep(3); }}
            disabled={!isStep2Valid}
            className="bg-primary text-primary-foreground font-bold text-sm px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-40"
          >
            Selanjutnya <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default MultiShotCreator;
