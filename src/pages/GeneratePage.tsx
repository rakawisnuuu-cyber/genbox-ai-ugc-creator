import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { geminiFetch } from "@/lib/gemini-fetch";
import {
  detectProductDNA,
  getCategoryPromptInstruction,
  buildProductConsistencyBlock,
  ALL_CATEGORIES,
  EMPTY_DNA,
  type ProductDNA,
  type ProductCategory,
} from "@/lib/product-dna";
import { getEnvironments, findOption } from "@/lib/category-options";
import { imageUrlToBase64, fileToBase64 } from "@/lib/image-utils";
import {
  Upload,
  X,
  Sparkles,
  Image as ImageIcon,
  AlertTriangle,
  Download,
  RefreshCw,
  Loader2,
  Plus,
  ArrowRight,
  ScanSearch,
  ZoomIn,
  Film,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useApiKeys } from "@/hooks/useApiKeys";
import { usePromptModel } from "@/hooks/usePromptModel";
import { useUpscale } from "@/hooks/useUpscale";
import { useToast } from "@/hooks/use-toast";
import UpscaleButton from "@/components/UpscaleButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { CharacterData } from "@/components/CharacterCard";
import { PRESETS } from "@/lib/character-presets";

/* ── Quality Blocks ─────────────────────────────────────────── */
const SKIN_BLOCK =
  "Skin is ultra-realistic, photorealistic and natural with soft visible texture — subtle pores visible at close inspection but not exaggerated, healthy even complexion with gentle natural variation, slight natural oil sheen on forehead and nose, realistic but not gritty. Minimal natural makeup: soft even base, subtle lip tint, natural brow grooming, fresh and awake-looking. No heavy contouring, no Instagram filter look, no plastic smoothing, no beauty app retouching — but also not raw or unflattering.";
const QUALITY_BLOCK =
  "8K resolution, ultra-high detail, photographic realism, sharp focus, natural color grading, realistic contrast, clean image quality. Shot on smartphone camera, natural shallow depth of field, slight natural grain.";
const NEGATIVE_BLOCK =
  "No cartoon, no anime, no CGI, no 3D render, no plastic skin, no over-smoothing, no glamour filter, no artificial glow, no fantasy lighting, no neon, no watermark, no text overlay, no distorted features, no extra fingers, no warped proportions, no game engine look, no hyper-saturated colors, no beauty app filter, no Instagram filter, no perfectly symmetrical rooms, no impossibly clean environments, no plastic-looking surfaces, no floating objects without shadows, no uniform flat lighting across entire scene, no AI-typical repeated patterns on walls or floors, no sterile empty rooms, no professional studio lighting setup, no editorial fashion photography, no stock photo composition.";

/* ── Kie AI helper ──────────────────────────────────────────── */
async function generateKieImage(
  kieApiKey: string,
  prompt: string,
  imageInputs: string[],
  abortCheck: () => boolean,
): Promise<string> {
  const createRes = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
    method: "POST",
    headers: { Authorization: `Bearer ${kieApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "nano-banana-pro",
      input: {
        prompt,
        image_input: [...new Set(imageInputs.filter(Boolean))],
        aspect_ratio: "3:4",
        resolution: "2K",
        output_format: "png",
        google_search: false,
      },
    }),
  });
  const createJson = await createRes.json();
  if (createJson.code !== 200 || !createJson.data?.taskId)
    throw new Error(createJson.message || "Failed to create task");
  const taskId = createJson.data.taskId;
  let polls = 0,
    consecutive404s = 0;
  const poll = async (): Promise<string> => {
    if (abortCheck()) throw new Error("Cancelled");
    const r = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
      headers: { Authorization: `Bearer ${kieApiKey}` },
    });
    if (r.status === 404) {
      consecutive404s++;
      if (consecutive404s >= 5) throw new Error("Task not found");
      await new Promise((res) => setTimeout(res, 3000));
      return poll();
    }
    consecutive404s = 0;
    const j = await r.json();
    if (j.data?.state === "success") {
      const rj = typeof j.data.resultJson === "string" ? JSON.parse(j.data.resultJson) : j.data.resultJson;
      const url = rj?.resultUrls?.[0] || rj?.url || "";
      if (!url) throw new Error("No image URL");
      return url;
    }
    if (j.data?.state === "fail") throw new Error(j.data?.msg || "Generation failed");
    polls++;
    if (polls >= 80) throw new Error("Timeout");
    await new Promise((res) => setTimeout(res, 3000));
    return poll();
  };
  return poll();
}

type GenState = "idle" | "loading" | "completed" | "failed";

interface GeneratedImage {
  url: string;
  prompt: string;
  elapsed: number;
}

/* ════════════════════════════════════════════════════════════ */

const GeneratePage = () => {
  const { user } = useAuth();
  const { kieApiKey, geminiKey, keys } = useApiKeys();
  const { model: promptModel } = usePromptModel();
  const { upscale, getState: getUpscaleState } = useUpscale();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  /* ── State ─────────────────────────────────────────────── */
  const [productPreview, setProductPreview] = useState<string | null>(null);
  const [productUrl, setProductUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [productDNA, setProductDNA] = useState<ProductDNA | null>(null);
  const [detectingDNA, setDetectingDNA] = useState(false);
  const [selectedCharId, setSelectedCharId] = useState("");
  const [selectedChar, setSelectedChar] = useState<CharacterData | null>(null);
  const [customChars, setCustomChars] = useState<CharacterData[]>([]);
  const [background, setBackground] = useState("");
  const [customBg, setCustomBg] = useState("");
  const [imageCount, setImageCount] = useState(6);
  const [contentType, setContentType] = useState<"ugc" | "commercial">("ugc");

  const [genState, setGenState] = useState<GenState>("idle");
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [currentGenerating, setCurrentGenerating] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [totalElapsed, setTotalElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef(false);

  const currentCategory = productDNA?.category || "other";
  const envOptions = getEnvironments(currentCategory);
  const selectedImage = generatedImages[selectedIdx] || null;

  /* ── Fetch characters ─────────────────────────────────── */
  useEffect(() => {
    if (!user) return;
    supabase
      .from("characters")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_preset", false)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data)
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
            })),
          );
      });
  }, [user]);

  useEffect(() => {
    const sc = (location.state as any)?.character as CharacterData | undefined;
    const pid = searchParams.get("characterId");
    if (sc) {
      setSelectedCharId(sc.id);
      setSelectedChar(sc);
    } else if (pid) {
      const f = [...PRESETS, ...customChars].find((c) => c.id === pid);
      if (f) {
        setSelectedCharId(f.id);
        setSelectedChar(f);
      }
    }
  }, [location.state, searchParams, customChars]);

  const onCharSelect = (id: string) => {
    setSelectedCharId(id);
    setSelectedChar([...PRESETS, ...customChars].find((c) => c.id === id) || null);
  };

  /* ── Product Upload + DNA ─────────────────────────────── */
  const runDNADetection = async (file: File) => {
    if (!geminiKey || keys.gemini.status !== "valid") return;
    setDetectingDNA(true);
    try {
      const b64 = await fileToBase64(file);
      const dna = await detectProductDNA(b64, promptModel, geminiKey!);
      setProductDNA(dna);
      toast({ title: `Detected: ${dna.category}/${dna.sub_category}` });
    } catch {
    } finally {
      setDetectingDNA(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Max 10 MB", variant: "destructive" });
      return;
    }
    setProductPreview(URL.createObjectURL(file));
    setProductDNA(null);
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
    setProductUrl(urlData.publicUrl);
    setUploading(false);
    runDNADetection(file);
  };
  const removeProduct = () => {
    setProductPreview(null);
    setProductUrl(null);
    setProductDNA(null);
  };

  /* ── Generate Multiple Images ─────────────────────────── */
  const generateAll = async () => {
    if (!kieApiKey || !geminiKey || !productUrl || !selectedChar) return;
    abortRef.current = false;
    setGenState("loading");
    setGeneratedImages([]);
    setSelectedIdx(0);
    setCurrentGenerating(0);
    setTotalElapsed(0);
    setErrorMsg("");
    timerRef.current = setInterval(() => setTotalElapsed((p) => p + 1), 1000);

    const characterIdentity = selectedChar.identity_prompt || selectedChar.description;
    const bg = background === "Custom" ? customBg : findOption(envOptions, background)?.description || background;
    const categoryInstruction = productDNA
      ? getCategoryPromptInstruction(productDNA)
      : "Describe the product from the image.";

    const imageInputs: string[] = [];
    if (selectedChar?.hero_image_url) imageInputs.push(selectedChar.hero_image_url);
    else if (selectedChar?.reference_photo_url) imageInputs.push(selectedChar.reference_photo_url);
    if (productUrl) imageInputs.push(productUrl);

    // Generate prompts via Gemini
    try {
      const parts: any[] = [];
      if (selectedChar.hero_image_url) {
        try {
          const cb = await imageUrlToBase64(selectedChar.hero_image_url);
          parts.push({ inlineData: { mimeType: "image/jpeg", data: cb } });
          parts.push({ text: "CHARACTER REFERENCE — recreate this EXACT person in every image." });
        } catch {}
      }
      if (productUrl) {
        try {
          const pb = await imageUrlToBase64(productUrl);
          parts.push({ inlineData: { mimeType: "image/jpeg", data: pb } });
          parts.push({ text: "PRODUCT REFERENCE — match this exact product." });
        } catch {}
      }

      const hasCharImage = selectedChar.hero_image_url || selectedChar.reference_photo_url;
      const charNote = hasCharImage
        ? "\nCHARACTER IMAGE ATTACHED: Describe this EXACT person. Each prompt MUST BEGIN with character appearance."
        : "";

      parts.push({
        text: `Generate ${imageCount} unique UGC image prompts for the same person with a product. Each prompt shows a DIFFERENT angle/pose/camera setup but the SAME person and product.

Character: ${selectedChar.name} — ${characterIdentity}
Product: ${productDNA?.category || "product"}/${productDNA?.sub_category || ""} — ${productDNA?.product_description || "see image"}
Environment: ${bg || "natural setting"}
${charNote}

CATEGORY DIRECTION:
${categoryInstruction}

RULES:
- ${imageCount} prompts, each 60-90 words
- Same person in every prompt (same face, skin, hair, body)
- Same product in every prompt
- Each prompt uses a DIFFERENT camera angle and pose
- Vary: selfie close-up, medium shot, POV, product hero, side profile, over-shoulder
- Photorealistic, UGC style, phone camera quality
- Do NOT add negative prompts

Return a JSON array of ${imageCount} prompt strings. No explanation.`,
      });

      const genConfig: Record<string, any> = {};
      if (promptModel !== "gemini-3.1-pro-preview") genConfig.responseMimeType = "application/json";
      const json = await geminiFetch(promptModel, geminiKey!, { contents: [{ parts }], generationConfig: genConfig });
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const cleaned = rawText
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
      const prompts: string[] = JSON.parse(cleaned);

      if (!Array.isArray(prompts) || prompts.length < 1) throw new Error("Invalid prompts");

      // Generate images sequentially
      const results: GeneratedImage[] = [];
      for (let i = 0; i < Math.min(prompts.length, imageCount); i++) {
        if (abortRef.current) break;
        setCurrentGenerating(i);
        const shotStart = Date.now();
        const enhancedPrompt = `${prompts[i]}\n\n${SKIN_BLOCK}\n\n${QUALITY_BLOCK}\n\n${NEGATIVE_BLOCK}`;

        try {
          const imageUrl = await generateKieImage(kieApiKey, enhancedPrompt, imageInputs, () => abortRef.current);
          const shotElapsed = Math.round((Date.now() - shotStart) / 1000);
          results.push({ url: imageUrl, prompt: prompts[i], elapsed: shotElapsed });
          setGeneratedImages([...results]);

          // Save to gallery
          await supabase.from("generations").insert({
            user_id: user!.id,
            type: "ugc_image",
            prompt: prompts[i],
            image_url: imageUrl,
            character_id: selectedChar.id.startsWith("p") ? null : selectedChar.id,
            provider: "kie_ai",
            model: "nano-banana-pro",
            status: "completed",
            metadata: { productDNA: productDNA || null, angle: `Shot ${i + 1}` } as any,
          });
        } catch (err: any) {
          if (abortRef.current) break;
          console.error(`Shot ${i + 1} failed:`, err.message);
          // Continue to next — don't block
        }
      }

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      setGenState(results.length > 0 ? "completed" : "failed");
      if (results.length === 0) setErrorMsg("All generations failed");
    } catch (err: any) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      if (!abortRef.current) {
        setGenState("failed");
        setErrorMsg(err.message || "Generation failed");
      }
    }
  };

  const cancelGeneration = () => {
    abortRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    if (generatedImages.length > 0) setGenState("completed");
    else setGenState("idle");
  };
  const canGenerate = !!productUrl && !!selectedChar && genState !== "loading";
  const isGenerating = genState === "loading";

  /* ── RENDER ────────────────────────────────────────────── */
  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-0px)] -mx-4 -my-4 lg:-mx-6 lg:-my-8">
      {/* ═══ LEFT — Controls ═══ */}
      <div className="w-full lg:w-[340px] xl:w-[380px] shrink-0 overflow-y-auto border-r border-white/[0.04] bg-[hsl(0_0%_4%)]">
        <div className="px-5 py-5 space-y-5">
          {/* Character + Product */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[9px] uppercase tracking-[0.15em] text-white/25 font-medium block mb-1.5">
                Character
              </label>
              {selectedChar?.hero_image_url ? (
                <div className="relative group">
                  <img
                    src={selectedChar.hero_image_url}
                    alt={selectedChar.name}
                    className="w-full aspect-[3/4] rounded-md object-cover border border-white/[0.06]"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent rounded-b-md p-2">
                    <p className="text-[10px] font-medium text-white/90 truncate">{selectedChar.name}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCharId("");
                      setSelectedChar(null);
                    }}
                    className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ) : (
                <Select value={selectedCharId} onValueChange={onCharSelect}>
                  <SelectTrigger className="w-full aspect-[3/4] rounded-md border-dashed border-white/[0.06] bg-white/[0.015] flex flex-col items-center justify-center gap-1 text-white/20 hover:border-white/[0.12] transition-colors [&>svg]:hidden">
                    <Plus className="h-4 w-4" />
                    <span className="text-[9px]">Select</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel className="text-[9px] text-white/25">Preset</SelectLabel>
                      {PRESETS.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-[11px]">
                          <span className="flex items-center gap-2">
                            {c.hero_image_url && (
                              <img src={c.hero_image_url} alt="" className="h-4 w-4 rounded-full object-cover" />
                            )}
                            {c.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    {customChars.length > 0 && (
                      <SelectGroup>
                        <SelectLabel className="text-[9px] text-white/25">Custom</SelectLabel>
                        {customChars.map((c) => (
                          <SelectItem key={c.id} value={c.id} className="text-[11px]">
                            <span className="flex items-center gap-2">
                              {c.hero_image_url && (
                                <img src={c.hero_image_url} alt="" className="h-4 w-4 rounded-full object-cover" />
                              )}
                              {c.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-[0.15em] text-white/25 font-medium block mb-1.5">
                Product
              </label>
              {productPreview ? (
                <div className="relative group">
                  <img
                    src={productPreview}
                    alt="Product"
                    className="w-full aspect-[3/4] rounded-md object-cover border border-white/[0.06]"
                  />
                  {uploading && (
                    <div className="absolute inset-0 bg-black/50 rounded-md flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-white/40" />
                    </div>
                  )}
                  <button
                    onClick={removeProduct}
                    className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                  {detectingDNA && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent rounded-b-md p-2 flex items-center gap-1">
                      <ScanSearch className="h-3 w-3 text-white/40 animate-pulse" />
                      <span className="text-[9px] text-white/40">Analyzing...</span>
                    </div>
                  )}
                  {productDNA && !detectingDNA && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent rounded-b-md p-2">
                      <p className="text-[9px] font-medium text-white/70">
                        {productDNA.category}
                        {productDNA.sub_category ? ` / ${productDNA.sub_category}` : ""}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files[0];
                    if (f) handleFileSelect(f);
                  }}
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
                  className="w-full aspect-[3/4] rounded-md border border-dashed border-white/[0.06] bg-white/[0.015] flex flex-col items-center justify-center gap-1 cursor-pointer text-white/20 hover:border-white/[0.12] transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  <span className="text-[9px]">Upload</span>
                </div>
              )}
            </div>
          </div>

          {/* Product DNA display */}
          {productDNA && (
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-md px-3 py-2.5">
              <p className="text-[9px] uppercase tracking-[0.15em] text-white/25 mb-1.5">Product Analysis</p>
              <p className="text-[11px] text-white/60 leading-relaxed">
                {productDNA.product_description?.slice(0, 120)}
                {(productDNA.product_description?.length || 0) > 120 ? "..." : ""}
              </p>
              <div className="flex gap-1.5 mt-2">
                {productDNA.dominant_color && (
                  <span className="text-[9px] px-2 py-0.5 rounded bg-white/[0.04] text-white/35">
                    {productDNA.dominant_color}
                  </span>
                )}
                {productDNA.packaging_type && (
                  <span className="text-[9px] px-2 py-0.5 rounded bg-white/[0.04] text-white/35">
                    {productDNA.packaging_type}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-white/[0.04]" />

          {/* Content Type */}
          <div>
            <label className="text-[9px] uppercase tracking-[0.15em] text-white/25 font-medium block mb-2">
              Content Type
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setContentType("ugc")}
                className={`h-9 rounded-md text-[10px] font-medium tracking-wide uppercase transition-all ${contentType === "ugc" ? "bg-white text-black" : "bg-white/[0.03] text-white/30 hover:text-white/50"}`}
              >
                UGC / Affiliator
              </button>
              <button
                onClick={() => setContentType("commercial")}
                disabled
                className={`h-9 rounded-md text-[10px] font-medium tracking-wide uppercase transition-all ${contentType === "commercial" ? "bg-white text-black" : "bg-white/[0.03] text-white/20 cursor-not-allowed"}`}
              >
                Commercial
              </button>
            </div>
          </div>

          {/* Image Count + Environment */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[9px] uppercase tracking-[0.15em] text-white/25 font-medium block mb-2">
                Jumlah
              </label>
              <div className="flex gap-1">
                {[3, 6, 9].map((n) => (
                  <button
                    key={n}
                    onClick={() => setImageCount(n)}
                    className={`flex-1 h-9 rounded-md text-[11px] font-medium transition-all ${imageCount === n ? "bg-white text-black" : "bg-white/[0.03] text-white/30 hover:text-white/50"}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-[0.15em] text-white/25 font-medium block mb-2">
                Environment
              </label>
              <Select value={background} onValueChange={setBackground}>
                <SelectTrigger className="h-9 bg-white/[0.03] border-white/[0.04] text-[11px] text-white/50">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {envOptions.map((opt) => (
                    <SelectItem key={opt.label} value={opt.label} className="text-[11px]">
                      {opt.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="Custom" className="text-[11px]">
                    Custom
                  </SelectItem>
                </SelectContent>
              </Select>
              {background === "Custom" && (
                <Input
                  value={customBg}
                  onChange={(e) => setCustomBg(e.target.value)}
                  placeholder="Describe..."
                  className="mt-1.5 h-8 bg-white/[0.03] border-white/[0.04] text-[11px]"
                />
              )}
            </div>
          </div>

          {/* Generate */}
          <button
            onClick={generateAll}
            disabled={!canGenerate}
            className="w-full h-11 bg-white text-black text-[11px] font-semibold uppercase tracking-widest rounded-md hover:bg-white/90 transition-colors disabled:opacity-15 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating {currentGenerating + 1}/{imageCount}...
              </span>
            ) : (
              "Generate"
            )}
          </button>

          {isGenerating && (
            <button
              onClick={cancelGeneration}
              className="w-full h-8 text-[10px] text-white/30 hover:text-white/60 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* ═══ CENTER — Image Grid ═══ */}
      <div className="flex-1 overflow-y-auto bg-[hsl(0_0%_3%)]">
        {genState === "idle" && generatedImages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center mb-3">
              <ImageIcon className="h-5 w-5 text-white/10" />
            </div>
            <p className="text-[11px] text-white/20">Select character and product to start</p>
          </div>
        )}

        {(genState === "loading" || genState === "completed") && (
          <div className="p-4">
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: imageCount }).map((_, i) => {
                const img = generatedImages[i];
                const isActive = i === selectedIdx && !!img;
                const isLoading = genState === "loading" && i === currentGenerating && !img;
                const isPending = genState === "loading" && i > currentGenerating && !img;
                return (
                  <div
                    key={i}
                    onClick={() => img && setSelectedIdx(i)}
                    className={`aspect-[3/4] rounded-md border overflow-hidden transition-all cursor-pointer ${isActive ? "border-white/30 ring-1 ring-white/20" : "border-white/[0.04]"} ${img ? "hover:border-white/20" : ""}`}
                  >
                    {img ? (
                      <img src={img.url} alt={`Shot ${i + 1}`} className="w-full h-full object-cover" />
                    ) : isLoading ? (
                      <div className="w-full h-full bg-white/[0.02] flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-white/20" />
                        <span className="text-[9px] text-white/20">Generating...</span>
                      </div>
                    ) : isPending ? (
                      <div className="w-full h-full bg-white/[0.015] flex items-center justify-center">
                        <span className="text-[9px] text-white/10">{i + 1}</span>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-white/[0.015]" />
                    )}
                  </div>
                );
              })}
            </div>
            {genState === "loading" && (
              <div className="flex items-center justify-center gap-2 mt-3">
                <span className="text-[10px] text-white/20 font-mono">
                  {Math.floor(totalElapsed / 60)}:{String(totalElapsed % 60).padStart(2, "0")}
                </span>
              </div>
            )}
          </div>
        )}

        {genState === "failed" && generatedImages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400/40" />
            <p className="text-[11px] text-red-400/50 text-center max-w-xs">{errorMsg}</p>
            <button
              onClick={generateAll}
              className="h-8 px-4 bg-white/[0.05] text-[10px] text-white/50 rounded-md hover:bg-white/[0.08] transition-colors"
            >
              Try again
            </button>
          </div>
        )}
      </div>

      {/* ═══ RIGHT — Preview + Actions ═══ */}
      <div className="w-full lg:w-[320px] xl:w-[360px] shrink-0 overflow-y-auto border-l border-white/[0.04] bg-[hsl(0_0%_4%)]">
        {selectedImage ? (
          <div className="p-4 space-y-4">
            {/* Preview */}
            <div className="rounded-lg overflow-hidden border border-white/[0.06]">
              <img src={selectedImage.url} alt="Selected" className="w-full aspect-[3/4] object-cover" />
            </div>

            {/* Meta */}
            <div className="flex items-center gap-2 text-[9px] text-white/25">
              <span>Shot {selectedIdx + 1}</span>
              <span className="w-px h-2.5 bg-white/[0.06]" />
              <span>{selectedImage.elapsed}s</span>
              <span className="w-px h-2.5 bg-white/[0.06]" />
              <span>nano-banana-pro</span>
            </div>

            {/* Actions */}
            <div className="space-y-1.5">
              <a
                href={getUpscaleState(`ugc_${selectedIdx}`).resultUrl || selectedImage.url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-9 bg-white text-black text-[10px] font-medium uppercase tracking-wider rounded-md flex items-center justify-center gap-2 hover:bg-white/90 transition-colors"
              >
                <Download className="h-3 w-3" /> Download
              </a>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => {
                    /* TODO: regenerate single */
                  }}
                  className="h-9 bg-white/[0.04] text-white/40 text-[10px] font-medium rounded-md flex items-center justify-center gap-1.5 hover:bg-white/[0.08] hover:text-white/60 transition-colors"
                >
                  <RefreshCw className="h-3 w-3" /> Regenerate
                </button>
                <UpscaleButton
                  imageUrl={selectedImage.url}
                  imageKey={`ugc_${selectedIdx}`}
                  loading={getUpscaleState(`ugc_${selectedIdx}`).loading}
                  currentFactor={getUpscaleState(`ugc_${selectedIdx}`).factor}
                  onUpscale={(k, u, f) => upscale(k, u, f)}
                />
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/[0.04]" />

            {/* Video Studio */}
            <div>
              <p className="text-[9px] uppercase tracking-[0.15em] text-white/25 font-medium mb-3">Video Studio</p>
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                {(["Grok", "Kling", "Veo"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() =>
                      navigate("/video", {
                        state: {
                          sourceImage: selectedImage.url,
                          baseImageUrl: selectedImage.url,
                          productDNA,
                          productCategory: productDNA?.category || "other",
                          characterId: selectedChar?.id?.startsWith("p") ? null : selectedChar?.id,
                          preferredModel: m.toLowerCase(),
                        },
                      })
                    }
                    className="h-9 bg-white/[0.03] text-white/35 text-[10px] font-medium rounded-md hover:bg-white/[0.06] hover:text-white/60 transition-colors"
                  >
                    {m}
                  </button>
                ))}
              </div>
              <button
                onClick={() =>
                  navigate("/video", {
                    state: {
                      sourceImage: selectedImage.url,
                      baseImageUrl: selectedImage.url,
                      productDNA,
                      productCategory: productDNA?.category || "other",
                      characterId: selectedChar?.id?.startsWith("p") ? null : selectedChar?.id,
                    },
                  })
                }
                className="w-full h-9 bg-white/[0.04] text-white/35 text-[10px] font-medium rounded-md flex items-center justify-center gap-2 hover:bg-white/[0.08] hover:text-white/60 transition-colors"
              >
                <Film className="h-3 w-3" /> Open Video Studio
              </button>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center px-6">
            <p className="text-[10px] text-white/15 text-center">Select an image to preview</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneratePage;
