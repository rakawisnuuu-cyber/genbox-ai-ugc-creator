import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import {
  Upload,
  X,
  Sparkles,
  Paintbrush,
  Image as ImageIcon,
  AlertTriangle,
  Download,
  RefreshCw,
  UserCircle,
  Loader2,
  Link as LinkIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useApiKeys } from "@/hooks/useApiKeys";
import { usePromptModel } from "@/hooks/usePromptModel";
import { useUpscale } from "@/hooks/useUpscale";
import { useToast } from "@/hooks/use-toast";
import { analyzeProduct, imageUrlToBase64 as analyzerImageUrlToBase64, type ProductAnalysis } from "@/lib/product-analyzer";
import UpscaleButton from "@/components/UpscaleButton";
import GenerationLoading from "@/components/GenerationLoading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import type { CharacterData } from "@/components/CharacterCard";

/* ── GENBOX Realism Blocks ──────────────────────────────────── */
const SKIN_BLOCK = "Skin is realistic and natural with soft visible texture — subtle pores visible at close inspection but not exaggerated, healthy even complexion with gentle natural variation, slight natural oil sheen on forehead and nose, realistic but not gritty. Minimal natural makeup: soft even base, subtle lip tint, natural brow grooming, fresh and awake-looking. No heavy contouring, no Instagram filter look, no plastic smoothing, no beauty app retouching — but also not raw or unflattering. Think: how a real person looks after light makeup and good lighting at a professional photo session.";
const QUALITY_BLOCK = "8K resolution, ultra-high detail, photographic realism, sharp focus, natural color grading, realistic contrast, clean studio image quality.";
const NEGATIVE_BLOCK = "No cartoon, no anime, no CGI, no 3D render, no plastic skin, no over-smoothing, no glamour filter, no artificial glow, no fantasy lighting, no neon, no watermark, no text overlay, no distorted features, no extra fingers, no warped proportions, no game engine look, no hyper-saturated colors, no beauty app filter, no Instagram filter.";

/* ── Helper: convert image URL to base64 ────────────────────── */
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

/* ── preset characters (same as CharactersPage) ─────────────── */
const PRESETS: CharacterData[] = [
  { id: "p1", name: "Hijab Casual", type: "Wanita", age_range: "20-25", style: "Modern", description: "Wanita muda dengan hijab modern pastel, ekspresi hangat dan ramah.", gradient_from: "from-emerald-900/40", gradient_to: "to-teal-900/40", is_preset: true },
  { id: "p2", name: "Urban Trendy", type: "Pria", age_range: "22-28", style: "Streetwear", description: "Pria muda urban dengan gaya streetwear, percaya diri dan modern.", gradient_from: "from-blue-900/40", gradient_to: "to-indigo-900/40", is_preset: true },
  { id: "p3", name: "Ibu Muda", type: "Wanita", age_range: "25-35", style: "Friendly", description: "Ibu muda yang relatable dan ramah.", gradient_from: "from-rose-900/40", gradient_to: "to-pink-900/40", is_preset: true },
  { id: "p4", name: "Mahasiswa", type: "Pria/Wanita", age_range: "18-22", style: "Energik", description: "Mahasiswa energik dan ceria.", gradient_from: "from-amber-900/40", gradient_to: "to-orange-900/40", is_preset: true },
  { id: "p5", name: "Beauty Enthusiast", type: "Wanita", age_range: "20-30", style: "Glowing", description: "Pecinta kecantikan dengan kulit glowing.", gradient_from: "from-fuchsia-900/40", gradient_to: "to-purple-900/40", is_preset: true },
  { id: "p6", name: "Bapak UMKM", type: "Pria", age_range: "35-50", style: "Profesional", description: "Bapak pengusaha yang terpercaya.", gradient_from: "from-slate-800/40", gradient_to: "to-zinc-800/40", is_preset: true },
  { id: "p7", name: "Gen-Z Creator", type: "Pria/Wanita", age_range: "17-22", style: "Trendy", description: "Content creator Gen-Z yang trendy.", gradient_from: "from-cyan-900/40", gradient_to: "to-sky-900/40", is_preset: true },
  { id: "p8", name: "Office Worker", type: "Pria/Wanita", age_range: "25-35", style: "Smart Casual", description: "Pekerja kantor yang rapi.", gradient_from: "from-gray-800/40", gradient_to: "to-neutral-800/40", is_preset: true },
  { id: "p9", name: "Ibu PKK", type: "Wanita", age_range: "35-50", style: "Ramah", description: "Ibu komunitas yang hangat.", gradient_from: "from-green-900/40", gradient_to: "to-lime-900/40", is_preset: true },
  { id: "p10", name: "Cowok Gym", type: "Pria", age_range: "22-30", style: "Athletic", description: "Pria atletis dan percaya diri.", gradient_from: "from-red-900/40", gradient_to: "to-orange-900/40", is_preset: true },
];

const BACKGROUNDS = ["Studio Putih", "Outdoor Cafe", "Kamar Tidur", "Dapur Modern", "Taman", "Custom"];
const POSES = ["Memegang Produk", "Selfie dengan Produk", "Flat Lay", "Unboxing", "Menggunakan Produk", "Review"];
const MOODS = ["Happy Review", "Excited Unboxing", "Casual Lifestyle", "Professional"];

type GenState = "idle" | "loading" | "completed" | "failed";

const GeneratePage = () => {
  const { user } = useAuth();
  const { kieApiKey, geminiKey, keys } = useApiKeys();
  const { model: promptModel } = usePromptModel();
  const { upscale, getState: getUpscaleState } = useUpscale();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Form state
  const [productFile, setProductFile] = useState<File | null>(null);
  const [productPreview, setProductPreview] = useState<string | null>(null);
  const [productUrl, setProductUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [selectedCharId, setSelectedCharId] = useState<string>("");
  const [selectedChar, setSelectedChar] = useState<CharacterData | null>(null);
  const [customChars, setCustomChars] = useState<CharacterData[]>([]);

  const [background, setBackground] = useState("");
  const [customBg, setCustomBg] = useState("");
  const [pose, setPose] = useState("");
  const [mood, setMood] = useState("");

  const [prompt, setPrompt] = useState("");
  const [generatingPrompt, setGeneratingPrompt] = useState(false);

  // Product analysis state
  const [productAnalysis, setProductAnalysis] = useState<ProductAnalysis | null>(null);
  const [analyzingProduct, setAnalyzingProduct] = useState(false);

  // Generation state
  const [genState, setGenState] = useState<GenState>("idle");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef(false);

  // Fetch custom characters
  useEffect(() => {
    if (!user) return;
    supabase
      .from("characters")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_preset", false)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) {
          setCustomChars(
            data.map((d) => ({
              id: d.id,
              name: d.name,
              type: d.type,
              age_range: d.age_range,
              style: d.style,
              description: d.description,
              gradient_from: d.gradient_from,
              gradient_to: d.gradient_to,
              is_preset: false,
              hero_image_url: d.hero_image_url ?? undefined,
              reference_images: d.reference_images ?? undefined,
              identity_prompt: d.identity_prompt ?? undefined,
              reference_photo_url: d.reference_photo_url ?? undefined,
            }))
          );
        }
      });
  }, [user]);

  // Pre-select character from navigation state or search params
  useEffect(() => {
    const stateChar = (location.state as any)?.character as CharacterData | undefined;
    const paramId = searchParams.get("characterId");
    if (stateChar) {
      setSelectedCharId(stateChar.id);
      setSelectedChar(stateChar);
    } else if (paramId) {
      const found = [...PRESETS, ...customChars].find((c) => c.id === paramId);
      if (found) {
        setSelectedCharId(found.id);
        setSelectedChar(found);
      }
    }
  }, [location.state, searchParams, customChars]);

  // Handle character select change
  const onCharSelect = (id: string) => {
    setSelectedCharId(id);
    const found = [...PRESETS, ...customChars].find((c) => c.id === id) || null;
    setSelectedChar(found);
  };

  /* ── Product Upload ───────────────────────────────────────── */
  const handleFileSelect = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File terlalu besar", description: "Maksimal 10MB", variant: "destructive" });
      return;
    }
    setProductFile(file);
    setProductPreview(URL.createObjectURL(file));
    setUploading(true);

    const ext = file.name.split(".").pop();
    const path = `${user!.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) {
      toast({ title: "Upload gagal", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
    const publicUrl = urlData.publicUrl;
    setProductUrl(publicUrl);
    setUploading(false);

    // Auto-analyze product in background
    if (geminiKey && keys.gemini.status === "valid") {
      setAnalyzingProduct(true);
      try {
        const base64 = await analyzerImageUrlToBase64(publicUrl);
        const analysis = await analyzeProduct(base64, geminiKey, promptModel);
        setProductAnalysis(analysis);
        console.log("Product analysis:", analysis);
      } catch (err) {
        console.error("Product analysis failed:", err);
      } finally {
        setAnalyzingProduct(false);
      }
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const removeProduct = () => {
    setProductFile(null);
    setProductPreview(null);
    setProductUrl(null);
    setProductAnalysis(null);
  };

  /* ── Prompt Generation via Gemini ─────────────────────────── */
  const generatePrompt = async () => {
    if (!geminiKey || keys.gemini.status !== "valid") {
      toast({ title: "Gemini API key belum di-setup", description: "Buka Settings untuk setup API key.", variant: "destructive" });
      return;
    }
    if (!selectedChar) {
      toast({ title: "Pilih karakter dulu", variant: "destructive" });
      return;
    }
    setGeneratingPrompt(true);
    try {
      const bg = background === "Custom" ? customBg : background;
      const characterIdentity = selectedChar.identity_prompt || selectedChar.description;

      // Build multimodal parts
      const parts: any[] = [];

      // Add product image if available
      if (productUrl) {
        try {
          const base64 = await imageUrlToBase64(productUrl);
          parts.push({
            inlineData: {
              mimeType: "image/jpeg",
              data: base64,
            },
          });
          parts.push({ text: "This is the product image. Describe it accurately in your prompt." });
        } catch (e) {
          console.warn("Failed to convert product image to base64:", e);
        }
      }

      // Add the main prompt text
      parts.push({
        text: `You are an expert UGC (user-generated content) prompt builder for AI image generation. Create a structured JSON prompt for a realistic product UGC photo.

Character: ${selectedChar.name}
Character Identity: ${characterIdentity}
Product: ${productAnalysis ? `KNOWN PRODUCT: ${productAnalysis.product_name}. EXACT VISUAL: ${productAnalysis.product_visual}. Features: ${productAnalysis.product_features}` : productUrl ? "Analyze the product image above — describe its exact shape, color, size, packaging, label, and type." : "User's product (no image provided)"}
Background: ${bg || "not specified"}
Pose: ${pose || "not specified"}
Mood: ${mood || "not specified"}

Respond ONLY with valid JSON:
{
  "product_description": "Exact description of the product from the image — shape, color, packaging, label text if visible, size",
  "scene_description": "Full scene description combining character + product + setting",
  "character_action": "Specific action with the product",
  "product_placement": "Exactly how the product appears — which hand holds it, position relative to face, angle of label",
  "lighting": "Lighting setup that complements the scene",
  "background": "Background/environment details",
  "camera": "Camera angle, distance, lens",
  "final_prompt": "Complete combined prompt ready for image generation. MUST include: exact product description, exact character appearance, scene details, lighting, camera. The product description must match the uploaded image precisely."
}`,
      });

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${promptModel}:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: { responseMimeType: "application/json" },
          }),
        }
      );
      const json = await res.json();
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
      try {
        const parsed = JSON.parse(rawText);
        // Append GENBOX realism blocks to final prompt
        const enhancedPrompt = `${parsed.final_prompt}\n\n${SKIN_BLOCK}\n\n${QUALITY_BLOCK}\n\n${NEGATIVE_BLOCK}`;
        setPrompt(enhancedPrompt);
      } catch {
        setPrompt(rawText.trim());
      }
    } catch {
      toast({ title: "Gagal generate prompt", variant: "destructive" });
    } finally {
      setGeneratingPrompt(false);
    }
  };

  /* ── Image Generation via Kie AI ──────────────────────────── */
  const startTimer = () => {
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
  };
  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const generate = async () => {
    // Validate keys
    if (!kieApiKey || keys.kie_ai.status !== "valid") {
      toast({ title: "Kie AI API key belum di-setup", description: "Buka Settings untuk setup API key.", variant: "destructive" });
      return;
    }
    if (!geminiKey || keys.gemini.status !== "valid") {
      toast({ title: "Gemini API key belum di-setup", description: "Buka Settings untuk setup API key.", variant: "destructive" });
      return;
    }
    if (!productUrl || !selectedChar || !prompt.trim()) return;

    abortRef.current = false;
    setGenState("loading");
    setResultUrl(null);
    setErrorMsg("");
    startTimer();

    try {
      // Build image_input array with character hero + product references
      const imageInputs: string[] = [];

      // Add original reference photo if character has one (highest priority face anchor)
      if (selectedChar?.reference_photo_url) {
        imageInputs.push(selectedChar.reference_photo_url);
      }

      // Add character hero image as secondary face reference (for custom characters)
      if (selectedChar && !selectedChar.id.startsWith("p") && selectedChar.hero_image_url) {
        imageInputs.push(selectedChar.hero_image_url);
      }

      // Add product image as product reference
      if (productUrl) {
        imageInputs.push(productUrl);
      }

      // Create task
      const createRes = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
        method: "POST",
        headers: { Authorization: `Bearer ${kieApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "nano-banana-pro",
          input: {
            prompt: prompt,
            image_input: imageInputs,
            aspect_ratio: "3:4",
            resolution: "2K",
            output_format: "jpg",
            google_search: false,
          },
        }),
      });
      const createJson = await createRes.json();
      if (createJson.code !== 200 || !createJson.data?.taskId) {
        throw new Error(createJson.message || "Failed to create task");
      }
      const taskId = createJson.data.taskId;

      // Poll
      let polls = 0;
      const maxPolls = 40;
      const poll = async (): Promise<string> => {
        if (abortRef.current) throw new Error("Cancelled");
        const r = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
          headers: { Authorization: `Bearer ${kieApiKey}` },
        });
        const j = await r.json();
        const state = j.data?.state;
        if (state === "success") {
          const resultJson = typeof j.data.resultJson === "string" ? JSON.parse(j.data.resultJson) : j.data.resultJson;
          const url = resultJson?.resultUrls?.[0] || resultJson?.url || "";
          if (!url) throw new Error("No image URL in result");
          return url;
        }
        if (state === "fail") throw new Error("Generation failed");
        polls++;
        if (polls >= maxPolls) throw new Error("Timeout — generation took too long");
        await new Promise((r) => setTimeout(r, 3000));
        return poll();
      };

      const imageUrl = await poll();
      stopTimer();
      setResultUrl(imageUrl);
      setGenState("completed");

      // Save to generations
      await supabase.from("generations").insert({
        user_id: user!.id,
        type: "ugc_image",
        prompt,
        image_url: imageUrl,
        character_id: selectedChar.id.startsWith("p") ? null : selectedChar.id,
        provider: "kie_ai",
        model: "nano-banana-pro",
        status: "completed",
        metadata: productAnalysis ? {
          product_analysis: productAnalysis,
          source_product_url: productUrl,
        } : {},
      } as any);
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

  const canGenerate = !!productUrl && !!selectedChar && !!prompt.trim() && genState !== "loading";

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div className="flex flex-col lg:flex-row lg:min-h-[calc(100vh-0px)] -mx-4 -my-4 lg:-mx-6 lg:-my-8">
      {/* LEFT PANEL */}
      <div className="w-full lg:w-[55%] overflow-y-auto px-4 lg:px-6 py-6 lg:py-8 space-y-6">
        {/* Header */}
        <div className="animate-fade-up">
          <h1 className="text-xl font-bold font-satoshi tracking-wider uppercase text-foreground">Generate Gambar</h1>
          <p className="text-xs text-muted-foreground mt-1">Buat konten UGC realistis dengan AI</p>
        </div>

        {/* Upload Produk */}
        <div className="animate-fade-up" style={{ animationDelay: "100ms" }}>
          <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium block mb-2.5">Upload Produk</label>
          {productPreview && (
            <div className="relative inline-block">
              <img src={productPreview} alt="Product" className="h-32 w-32 rounded-xl object-cover border border-border" />
              <button
                onClick={removeProduct}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
              >
                <X className="h-3 w-3" />
              </button>
              {uploading && (
                <div className="absolute inset-0 bg-background/60 rounded-xl flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              )}
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
              {productAnalysis.character_model && (
                <p className="text-[10px] text-primary/70 mt-1">💡 Karakter disarankan: {productAnalysis.character_model}</p>
              )}
            </div>
          )}
          {!productPreview && (
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
              <p className="text-sm text-muted-foreground">Drag & drop foto produk</p>
              <p className="text-xs text-muted-foreground">atau klik untuk pilih file</p>
              <p className="text-[11px] text-muted-foreground/60">JPEG, PNG, WebP — Maks 10MB</p>
            </div>
          )}
        </div>

        {/* Pilih Karakter */}
        <div className="animate-fade-up" style={{ animationDelay: "150ms" }}>
          <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium block mb-2.5">Pilih Karakter</label>
          <Select value={selectedCharId} onValueChange={onCharSelect}>
            <SelectTrigger className="bg-[hsl(0_0%_10%)] border-border">
              <SelectValue placeholder="Pilih karakter..." />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Preset</SelectLabel>
                {PRESETS.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-2">
                      <UserCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                      {c.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
              {customChars.length > 0 && (
                <SelectGroup>
                  <SelectLabel>Karakter Saya</SelectLabel>
                  {customChars.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="flex items-center gap-2">
                        {c.hero_image_url ? (
                          <img src={c.hero_image_url} alt={c.name} className="h-6 w-6 rounded-full object-cover shrink-0" />
                        ) : (
                          <UserCircle className="h-4 w-4 text-primary shrink-0" />
                        )}
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
            </SelectContent>
          </Select>

          {selectedChar && (
            <div className="mt-3 flex items-center gap-3 bg-card border border-border rounded-lg p-3">
              {selectedChar.hero_image_url ? (
                <img src={selectedChar.hero_image_url} alt={selectedChar.name} className="h-10 w-10 rounded-full object-cover shrink-0" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <UserCircle className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{selectedChar.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {[selectedChar.type, selectedChar.age_range, selectedChar.style].filter(Boolean).join(" • ")}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={() => navigate("/characters/create")}
            className="mt-2 text-xs text-primary hover:underline inline-flex items-center gap-1"
          >
            Buat karakter baru <LinkIcon className="h-3 w-3" />
          </button>
        </div>

        {/* Pengaturan Scene */}
        <div className="animate-fade-up space-y-6" style={{ animationDelay: "200ms" }}>
          <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium block">Pengaturan Scene</label>

          <div>
            <label className="text-xs text-muted-foreground block mb-2.5">Background</label>
            <Select value={background} onValueChange={setBackground}>
              <SelectTrigger className="bg-[hsl(0_0%_10%)] border-border"><SelectValue placeholder="Pilih background..." /></SelectTrigger>
              <SelectContent>
                {BACKGROUNDS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
            {background === "Custom" && (
              <Input
                value={customBg}
                onChange={(e) => setCustomBg(e.target.value)}
                placeholder="Deskripsikan background..."
                className="mt-2 bg-[hsl(0_0%_10%)] border-border"
              />
            )}
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-2.5">Pose</label>
            <Select value={pose} onValueChange={setPose}>
              <SelectTrigger className="bg-[hsl(0_0%_10%)] border-border"><SelectValue placeholder="Pilih pose..." /></SelectTrigger>
              <SelectContent>
                {POSES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-2.5">Mood</label>
            <Select value={mood} onValueChange={setMood}>
              <SelectTrigger className="bg-[hsl(0_0%_10%)] border-border"><SelectValue placeholder="Pilih mood..." /></SelectTrigger>
              <SelectContent>
                {MOODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Prompt */}
        <div className="animate-fade-up" style={{ animationDelay: "250ms" }}>
          <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium block mb-2.5">Prompt</label>
          <button
            onClick={generatePrompt}
            disabled={generatingPrompt || !selectedChar}
            className="mb-3 inline-flex items-center gap-2 border border-primary text-primary text-xs font-bold px-4 py-2 rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
          >
            {generatingPrompt ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            GENERATE PROMPT
          </button>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            placeholder="Prompt akan di-generate otomatis atau tulis manual..."
            className="bg-[hsl(0_0%_10%)] border-border text-sm"
          />
          <p className="text-[11px] text-muted-foreground/60 mt-1.5">Edit prompt untuk hasil yang lebih baik</p>
        </div>

        {/* Generate */}
        <div className="animate-fade-up" style={{ animationDelay: "300ms" }}>
          <div className="flex items-start gap-2 bg-card border border-border rounded-lg p-3 mb-4">
            <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Estimasi biaya: ~Rp 150-500 dari API key kamu</p>
              <p className="text-[11px] text-muted-foreground/60">Output tanpa watermark</p>
            </div>
          </div>
          <button
            onClick={generate}
            disabled={!canGenerate}
            className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-wider py-3.5 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-40 animate-cta-glow disabled:animate-none"
          >
            <Paintbrush className="h-4 w-4" />
            Generate Gambar
          </button>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-[45%] bg-[hsl(0_0%_5%)] border-t lg:border-t-0 lg:border-l border-border flex items-center justify-center p-6 lg:p-10 min-h-[400px] lg:min-h-0">
        {genState === "idle" && (
          <div className="flex flex-col items-center text-center animate-fade-in">
            <ImageIcon className="h-16 w-16 text-foreground/10 mb-4" />
            <p className="text-sm text-muted-foreground">Hasil generasi akan muncul di sini</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Upload produk dan pilih karakter untuk mulai</p>
          </div>
        )}

        {genState === "loading" && (
          <GenerationLoading
            model="image"
            elapsed={elapsed}
            aspectRatio="3:4"
            prompt={prompt}
            modelLabel="nano-banana-pro"
            badgeColor="bg-primary/20 text-primary"
            onCancel={cancelGeneration}
          />
        )}

        {genState === "completed" && resultUrl && (
          <div className="flex flex-col items-center gap-4 w-full max-w-sm animate-fade-in">
            <img
              src={resultUrl}
              alt="Generated UGC"
              className="w-full rounded-xl border-2 border-primary/20 shadow-lg object-cover"
            />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>nano-banana-pro</span>
              <span>•</span>
              <span>{elapsed}s</span>
            </div>
            <div className="flex gap-2 w-full">
              <a
                href={getUpscaleState("ugc_result").resultUrl || resultUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-primary text-primary-foreground font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </a>
              <UpscaleButton
                imageUrl={resultUrl}
                imageKey="ugc_result"
                loading={getUpscaleState("ugc_result").loading}
                currentFactor={getUpscaleState("ugc_result").factor}
                onUpscale={(k, u, f) => upscale(k, u, f)}
              />
              <button
                onClick={() => { setGenState("idle"); setResultUrl(null); }}
                className="border border-border text-muted-foreground text-xs py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 hover:text-foreground transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
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
            <button
              onClick={generate}
              className="bg-primary text-primary-foreground font-bold text-xs px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneratePage;
