import { useState, useEffect, useCallback } from "react";
import { Sparkles, ScanSearch, Wand2, Loader2, X, Upload, Trash2, BookOpen } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useApiKeys } from "@/hooks/useApiKeys";
import { supabase } from "@/integrations/supabase/client";
import { geminiFetch } from "@/lib/gemini-fetch";
import { usePromptModel } from "@/hooks/usePromptModel";
import { fileToBase64 } from "@/lib/image-utils";
import {
  CAMPAIGN_SYSTEM_PROMPT,
  DECODE_SYSTEM_PROMPT,
  MOTION_SYSTEM_PROMPT,
} from "@/lib/prompt-engine-system";
import OutputPanel from "@/components/prompt-engine/OutputPanel";

type Mode = "campaign" | "decode" | "motion";

interface PromptEnginPageProps {
  initialMode?: Mode;
}

interface LibraryItem {
  id: string;
  mode: string;
  title: string;
  json_output: string;
  natural_prompt: string;
  input_data: any;
  created_at: string;
}

const MODE_CARDS: { mode: Mode; icon: typeof Sparkles; title: string; desc: string }[] = [
  { mode: "campaign", icon: Sparkles, title: "Campaign Concept", desc: "AI generate konsep campaign & style direction lengkap" },
  { mode: "decode", icon: ScanSearch, title: "Decode Visual", desc: "Extract prompt dari gambar atau video referensi" },
  { mode: "motion", icon: Wand2, title: "Motion Prompt", desc: "Generate prompt animasi & camera movement dari gambar" },
];

const CAMERA_MOVEMENTS = ["Static", "Dolly In", "Dolly Out", "Orbit", "Pan Left", "Pan Right", "Crane Up", "Crane Down", "Handheld"];
const DURATIONS = ["3s", "5s", "8s", "10s"];
const PLATFORMS = ["Kling", "Runway", "Seedance", "Wan"];

function parseAiResponse(raw: string): { json: string; natural: string } {
  const jsonMatch = raw.match(/```json\s*([\s\S]*?)```/);
  const naturalMatch = raw.match(/---NATURAL---\s*([\s\S]*?)$/);
  const jsonBlock = jsonMatch ? jsonMatch[1].trim() : "";
  const naturalBlock = naturalMatch ? naturalMatch[1].trim() : raw.replace(/```json[\s\S]*?```/, "").replace(/---NATURAL---/, "").trim();
  return { json: jsonBlock || raw, natural: naturalBlock || raw };
}

export default function PromptEnginePage({ initialMode = "campaign" }: PromptEnginPageProps) {
  const { user } = useAuth();
  const { keys } = useApiKeys();
  const { model: promptModel } = usePromptModel();
  const apiKey = keys.gemini.key;
  const apiKeyValid = keys.gemini.status === "valid";

  const [activeTab, setActiveTab] = useState<"engine" | "library">("engine");
  const [mode, setMode] = useState<Mode>(initialMode);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Campaign state
  const [purpose, setPurpose] = useState("");
  const [moods, setMoods] = useState<string[]>([]);
  const [moodInput, setMoodInput] = useState("");
  const [world, setWorld] = useState("");
  const [concepts, setConcepts] = useState<{ title: string; desc: string; props: string; lighting: string; styling: string }[]>([]);
  const [selectedConcepts, setSelectedConcepts] = useState<number[]>([]);
  const [conceptCustomizations, setConceptCustomizations] = useState<Record<number, Record<string, string>>>({});

  // Decode state
  const [decodeImage, setDecodeImage] = useState<File | null>(null);
  const [decodePreview, setDecodePreview] = useState<string | null>(null);

  // Motion state
  const [motionImage, setMotionImage] = useState<File | null>(null);
  const [motionPreview, setMotionPreview] = useState<string | null>(null);
  const [duration, setDuration] = useState("3s");
  const [cameraMovement, setCameraMovement] = useState("Static");
  const [motionMoods, setMotionMoods] = useState<string[]>([]);
  const [motionMoodInput, setMotionMoodInput] = useState("");
  const [platform, setPlatform] = useState("Kling");

  // Output state
  const [jsonOutput, setJsonOutput] = useState("");
  const [naturalPrompt, setNaturalPrompt] = useState("");

  // Library
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [viewingItem, setViewingItem] = useState<LibraryItem | null>(null);

  const callGemini = useCallback(async (
    systemPrompt: string,
    userMessage: string,
    imageBase64?: { mimeType: string; data: string },
  ): Promise<string> => {
    if (!apiKey) throw new Error("Gemini API key belum di-setup");
    const contentParts: any[] = [];
    if (imageBase64) {
      contentParts.push({ inlineData: { mimeType: imageBase64.mimeType, data: imageBase64.data } });
    }
    contentParts.push({ text: userMessage });
    const json = await geminiFetch(promptModel, apiKey, {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: contentParts }],
    });
    return json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
  }, [apiKey, promptModel]);

  const fetchLibrary = useCallback(async () => {
    if (!user) return;
    setLibraryLoading(true);
    const { data } = await supabase
      .from("prompt_library" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setLibrary((data as any[]) || []);
    setLibraryLoading(false);
  }, [user]);

  useEffect(() => {
    if (activeTab === "library") fetchLibrary();
  }, [activeTab, fetchLibrary]);

  const resetMode = () => {
    setStep(0);
    setConcepts([]);
    setSelectedConcepts([]);
    setConceptCustomizations({});
    setDecodeImage(null);
    setDecodePreview(null);
    setMotionImage(null);
    setMotionPreview(null);
    setJsonOutput("");
    setNaturalPrompt("");
  };

  const handleModeChange = (m: Mode) => {
    setMode(m);
    resetMode();
  };

  // ─── Campaign Flow ───
  const generateConcepts = async () => {
    if (!apiKey) {
      toast({ title: "API Key diperlukan", description: "Simpan Gemini/OpenAI API key di Settings.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setStep(1);
    try {
      const userMsg = `PURPOSE: ${purpose}\nMOOD: ${moods.join(", ")}\nWORLD/SETTING: ${world}\n\nGenerate 5-8 distinct scene concepts for this campaign.`;
      const raw = await callGemini(CAMPAIGN_SYSTEM_PROMPT, userMsg);
      const parsed = parseConcepts(raw);
      setConcepts(parsed);
      setStep(2);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
      setStep(0);
    } finally {
      setLoading(false);
    }
  };

  const parseConcepts = (raw: string) => {
    const blocks = raw.split(/CONCEPT \d+:/i).filter(Boolean);
    return blocks.map((block) => {
      const lines = block.trim().split("\n").filter(Boolean);
      const title = lines[0]?.replace(/^\*\*|\*\*$/g, "").trim() || "Untitled";
      const desc = lines[1]?.trim() || "";
      const props = lines.find((l) => l.toLowerCase().startsWith("props:"))?.replace(/^props:\s*/i, "") || "";
      const lighting = lines.find((l) => l.toLowerCase().startsWith("lighting:"))?.replace(/^lighting:\s*/i, "") || "";
      const styling = lines.find((l) => l.toLowerCase().startsWith("styling:"))?.replace(/^styling:\s*/i, "") || "";
      return { title, desc, props, lighting, styling };
    });
  };

  const generateFinalPrompts = async () => {
    if (!apiKey) return;
    setLoading(true);
    setStep(3);
    try {
      const selected = selectedConcepts.map((i) => {
        const c = concepts[i];
        const custom = conceptCustomizations[i] || {};
        return `Scene: ${c.title}\n${c.desc}\nCustomizations: ${JSON.stringify(custom)}`;
      });
      const userMsg = `Generate complete production prompts for these selected concepts:\n\n${selected.join("\n\n---\n\n")}\n\nOriginal brief — Purpose: ${purpose}, Mood: ${moods.join(", ")}, World: ${world}`;
      const raw = await callGemini(CAMPAIGN_SYSTEM_PROMPT, userMsg);
      const { json, natural } = parseAiResponse(raw);
      setJsonOutput(json);
      setNaturalPrompt(natural);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  // ─── Decode Flow ───
  const handleDecodeUpload = (file: File) => {
    setDecodeImage(file);
    setDecodePreview(URL.createObjectURL(file));
  };

  const decodeImageAction = async () => {
    if (!decodeImage || !apiKey) return;
    setLoading(true);
    setStep(1);
    try {
      const base64 = await fileToBase64(decodeImage);
      const raw = await callGemini(
        DECODE_SYSTEM_PROMPT,
        "Decode this image into a reusable production prompt.",
        { mimeType: decodeImage.type || "image/jpeg", data: base64 }
      );
      const { json, natural } = parseAiResponse(raw);
      setJsonOutput(json);
      setNaturalPrompt(natural);
      setStep(2);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
      setStep(0);
    } finally {
      setLoading(false);
    }
  };

  // ─── Motion Flow ───
  const handleMotionUpload = (file: File) => {
    setMotionImage(file);
    setMotionPreview(URL.createObjectURL(file));
  };

  const generateMotionPrompt = async () => {
    if (!motionImage || !apiKey) return;
    setLoading(true);
    setStep(1);
    try {
      const base64 = await fileToBase64(motionImage);
      const userMsg = `Duration: ${duration}\nCamera Movement: ${cameraMovement}\nMood: ${motionMoods.join(", ") || "cinematic"}\nTarget Platform: ${platform}\n\nGenerate a detailed motion prompt from this reference image.`;
      const raw = await callGemini(
        MOTION_SYSTEM_PROMPT,
        userMsg,
        { mimeType: motionImage.type || "image/jpeg", data: base64 }
      );
      const { json, natural } = parseAiResponse(raw);
      setJsonOutput(json);
      setNaturalPrompt(natural);
      setStep(2);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
      setStep(0);
    } finally {
      setLoading(false);
    }
  };

  // ─── Delete library item ───
  const deleteLibraryItem = async (id: string) => {
    await supabase.from("prompt_library" as any).delete().eq("id", id);
    setLibrary((prev) => prev.filter((item) => item.id !== id));
    if (viewingItem?.id === id) setViewingItem(null);
    toast({ title: "Dihapus", description: "Prompt dihapus dari library." });
  };

  // ─── Mood tag input handler ───
  const handleMoodKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    input: string,
    setInput: (v: string) => void,
    list: string[],
    setList: (v: string[]) => void
  ) => {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault();
      if (!list.includes(input.trim())) {
        setList([...list, input.trim()]);
      }
      setInput("");
    }
  };

  // ─── Step indicators ───
  const totalSteps = mode === "campaign" ? 4 : 3;
  const currentStep = mode === "campaign" ? step : step;

  // ─── File drop handler ───
  const handleDrop = (e: React.DragEvent, handler: (f: File) => void) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handler(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, handler: (f: File) => void) => {
    const file = e.target.files?.[0];
    if (file) handler(file);
  };

  // ─── Mode badge color ───
  const modeBadge = (m: string) => {
    if (m === "campaign") return "bg-primary/10 text-primary";
    if (m === "decode") return "bg-blue-500/10 text-blue-400";
    return "bg-purple-500/10 text-purple-400";
  };

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-border/30 w-fit">
        <button
          onClick={() => setActiveTab("engine")}
          className={`px-4 py-2 rounded-lg text-[12px] font-semibold transition-all ${activeTab === "engine" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Sparkles className="w-3.5 h-3.5 inline mr-1.5" />
          Prompt Engine
        </button>
        <button
          onClick={() => setActiveTab("library")}
          className={`px-4 py-2 rounded-lg text-[12px] font-semibold transition-all ${activeTab === "library" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          <BookOpen className="w-3.5 h-3.5 inline mr-1.5" />
          Library
        </button>
      </div>

      {activeTab === "library" ? (
        /* ─── Library View ─── */
        <div>
          {viewingItem ? (
            <div className="space-y-4">
              <button onClick={() => setViewingItem(null)} className="text-[12px] text-muted-foreground hover:text-foreground flex items-center gap-1">
                ← Back to Library
              </button>
              <h2 className="text-lg font-bold">{viewingItem.title}</h2>
              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${modeBadge(viewingItem.mode)}`}>
                {viewingItem.mode.toUpperCase()}
              </span>
              <OutputPanel
                jsonOutput={viewingItem.json_output}
                naturalPrompt={viewingItem.natural_prompt}
                mode={viewingItem.mode}
                title={viewingItem.title}
                inputData={viewingItem.input_data || {}}
              />
            </div>
          ) : (
            <>
              {libraryLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : library.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground/50 text-sm">
                  Belum ada prompt tersimpan. Generate dan simpan prompt pertamamu!
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {library.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-border/30 bg-white/[0.02] p-4 cursor-pointer hover:border-border/60 transition-colors group"
                      onClick={() => setViewingItem(item)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${modeBadge(item.mode)}`}>
                          {item.mode.toUpperCase()}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteLibraryItem(item.id); }}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-destructive transition-all p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <h3 className="text-[13px] font-bold text-foreground/80 mb-1 line-clamp-1">{item.title}</h3>
                      <p className="text-[11px] text-muted-foreground/50 line-clamp-2">{item.natural_prompt}</p>
                      <p className="text-[10px] text-muted-foreground/30 mt-2">
                        {new Date(item.created_at).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* ─── Engine View ─── */
        <div className="space-y-6">
          {/* Mode Selector */}
          <div className="grid gap-3 sm:grid-cols-3">
            {MODE_CARDS.map((card) => (
              <button
                key={card.mode}
                onClick={() => handleModeChange(card.mode)}
                className={`rounded-xl border p-4 text-left transition-all ${
                  mode === card.mode
                    ? "border-primary/50 bg-primary/5"
                    : "border-border/30 bg-white/[0.02] hover:border-border/60"
                }`}
              >
                <card.icon className={`w-5 h-5 mb-2 ${mode === card.mode ? "text-primary" : "text-muted-foreground/50"}`} />
                <h3 className="text-[13px] font-bold">{card.title}</h3>
                <p className="text-[11px] text-muted-foreground/50 mt-0.5">{card.desc}</p>
              </button>
            ))}
          </div>

          {/* Step Indicators */}
          <div className="flex items-center gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i <= currentStep ? "bg-primary w-8" : "bg-border/40 w-5"
                }`}
              />
            ))}
            <span className="ml-2 text-[10px] text-muted-foreground/40">
              Step {currentStep + 1} / {totalSteps}
            </span>
          </div>

          {/* ─── Campaign Mode ─── */}
          {mode === "campaign" && (
            <>
              {step === 0 && (
                <div className="space-y-5">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-1.5 block">Purpose</label>
                    <input
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      placeholder="Lookbook musim panas, product launch, editorial..."
                      className="w-full rounded-xl border border-border/30 bg-white/[0.02] px-4 py-3 text-[13px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/40"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-1.5 block">Mood Keywords</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {moods.map((m) => (
                        <span key={m} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[11px] font-medium">
                          {m}
                          <button onClick={() => setMoods(moods.filter((x) => x !== m))} className="hover:text-foreground"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                    <input
                      value={moodInput}
                      onChange={(e) => setMoodInput(e.target.value)}
                      onKeyDown={(e) => handleMoodKeyDown(e, moodInput, setMoodInput, moods, setMoods)}
                      placeholder="Ketik mood lalu tekan Enter..."
                      className="w-full rounded-xl border border-border/30 bg-white/[0.02] px-4 py-3 text-[13px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/40"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-1.5 block">World / Setting</label>
                    <input
                      value={world}
                      onChange={(e) => setWorld(e.target.value)}
                      placeholder="Tokyo street at dusk, minimalist studio, tropical villa..."
                      className="w-full rounded-xl border border-border/30 bg-white/[0.02] px-4 py-3 text-[13px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/40"
                    />
                  </div>
                  <button
                    onClick={generateConcepts}
                    disabled={!purpose || moods.length === 0 || !world || !apiKeyValid}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-[13px] disabled:opacity-40 hover:brightness-110 transition-all"
                  >
                    Generate Concepts
                  </button>
                </div>
              )}

              {step === 1 && loading && (
                <div className="flex flex-col items-center py-20 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <p className="text-[12px] text-muted-foreground/50">Generating campaign concepts...</p>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Pilih Konsep ({selectedConcepts.length} dipilih)</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {concepts.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedConcepts((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i])}
                        className={`rounded-xl border p-4 text-left transition-all ${
                          selectedConcepts.includes(i)
                            ? "border-primary/50 bg-primary/5"
                            : "border-border/30 bg-white/[0.02] hover:border-border/60"
                        }`}
                      >
                        <h4 className="text-[13px] font-bold mb-1">{c.title}</h4>
                        <p className="text-[11px] text-foreground/70 mb-2">{c.desc}</p>
                        <div className="space-y-0.5 text-[10px] text-muted-foreground/40">
                          {c.props && <p>Props: {c.props}</p>}
                          {c.lighting && <p>Lighting: {c.lighting}</p>}
                          {c.styling && <p>Styling: {c.styling}</p>}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Customization for selected concepts */}
                  {selectedConcepts.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Customize (Opsional)</p>
                      {selectedConcepts.map((idx) => (
                        <div key={idx} className="rounded-xl border border-border/20 bg-white/[0.01] p-4 space-y-2">
                          <p className="text-[12px] font-bold text-foreground/70">{concepts[idx].title}</p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {["Model Count", "Outfit", "Pose & Expression", "Camera Lens"].map((field) => (
                              <input
                                key={field}
                                placeholder={field}
                                value={conceptCustomizations[idx]?.[field] || ""}
                                onChange={(e) =>
                                  setConceptCustomizations((prev) => ({
                                    ...prev,
                                    [idx]: { ...prev[idx], [field]: e.target.value },
                                  }))
                                }
                                className="rounded-lg border border-border/20 bg-white/[0.02] px-3 py-2 text-[11px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/30"
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={generateFinalPrompts}
                    disabled={selectedConcepts.length === 0}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-[13px] disabled:opacity-40 hover:brightness-110 transition-all"
                  >
                    Generate Full Prompts
                  </button>
                </div>
              )}

              {step === 3 && loading && (
                <div className="flex flex-col items-center py-20 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <p className="text-[12px] text-muted-foreground/50">Generating final prompts...</p>
                </div>
              )}

              {step === 3 && !loading && jsonOutput && (
                <OutputPanel
                  jsonOutput={jsonOutput}
                  naturalPrompt={naturalPrompt}
                  mode="campaign"
                  title={`Campaign: ${purpose}`}
                  inputData={{ purpose, moods, world, selectedConcepts }}
                  onGenerateAgain={() => { setStep(2); setJsonOutput(""); setNaturalPrompt(""); }}
                  onSaved={fetchLibrary}
                />
              )}
            </>
          )}

          {/* ─── Decode Mode ─── */}
          {mode === "decode" && (
            <>
              {step === 0 && (
                <div className="space-y-4">
                  {decodePreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-border/30 bg-white/[0.02]">
                      <img src={decodePreview} alt="Preview" className="w-full max-h-[300px] object-contain" />
                      <button
                        onClick={() => { setDecodeImage(null); setDecodePreview(null); }}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white/70 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label
                      className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/30 bg-white/[0.02] py-16 cursor-pointer hover:border-primary/30 transition-colors"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(e, handleDecodeUpload)}
                    >
                      <Upload className="w-8 h-8 text-muted-foreground/30 mb-3" />
                      <p className="text-[13px] text-muted-foreground/50 font-medium">Drop image atau klik untuk upload</p>
                      <p className="text-[11px] text-muted-foreground/30 mt-1">JPG, PNG, WebP</p>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileInput(e, handleDecodeUpload)} />
                    </label>
                  )}
                  <button
                    onClick={decodeImageAction}
                    disabled={!decodeImage || !apiKeyValid}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-[13px] disabled:opacity-40 hover:brightness-110 transition-all"
                  >
                    Decode Image
                  </button>
                </div>
              )}

              {step === 1 && loading && (
                <div className="flex flex-col items-center py-20 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <p className="text-[12px] text-muted-foreground/50">Menganalisis lighting, camera, styling...</p>
                </div>
              )}

              {step === 2 && !loading && jsonOutput && (
                <OutputPanel
                  jsonOutput={jsonOutput}
                  naturalPrompt={naturalPrompt}
                  mode="decode"
                  title="Decoded Image"
                  inputData={{}}
                  onGenerateAgain={() => { setStep(0); setJsonOutput(""); setNaturalPrompt(""); }}
                  onSaved={fetchLibrary}
                />
              )}
            </>
          )}

          {/* ─── Motion Mode ─── */}
          {mode === "motion" && (
            <>
              {step === 0 && (
                <div className="space-y-5">
                  <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-5 lg:space-y-0">
                    {/* Left: Upload */}
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-1.5 block">Reference Image</label>
                      {motionPreview ? (
                        <div className="relative rounded-xl overflow-hidden border border-border/30 bg-white/[0.02]">
                          <img src={motionPreview} alt="Preview" className="w-full max-h-[250px] object-contain" />
                          <button
                            onClick={() => { setMotionImage(null); setMotionPreview(null); }}
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white/70 hover:text-white"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label
                          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/30 bg-white/[0.02] py-14 cursor-pointer hover:border-primary/30 transition-colors"
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => handleDrop(e, handleMotionUpload)}
                        >
                          <Upload className="w-7 h-7 text-muted-foreground/30 mb-2" />
                          <p className="text-[12px] text-muted-foreground/50 font-medium">Upload referensi</p>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileInput(e, handleMotionUpload)} />
                        </label>
                      )}
                    </div>

                    {/* Right: Settings */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-1.5 block">Duration</label>
                        <div className="flex gap-2">
                          {DURATIONS.map((d) => (
                            <button
                              key={d}
                              onClick={() => setDuration(d)}
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                                duration === d ? "bg-primary/10 text-primary border border-primary/30" : "bg-white/[0.02] border border-border/30 text-muted-foreground hover:border-border/60"
                              }`}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-1.5 block">Camera Movement</label>
                        <div className="flex flex-wrap gap-1.5">
                          {CAMERA_MOVEMENTS.map((cm) => (
                            <button
                              key={cm}
                              onClick={() => setCameraMovement(cm)}
                              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                                cameraMovement === cm ? "bg-primary/10 text-primary border border-primary/30" : "bg-white/[0.02] border border-border/30 text-muted-foreground hover:border-border/60"
                              }`}
                            >
                              {cm}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-1.5 block">Mood</label>
                        <div className="flex flex-wrap gap-1.5 mb-1.5">
                          {motionMoods.map((m) => (
                            <span key={m} className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[10px] font-medium">
                              {m}
                              <button onClick={() => setMotionMoods(motionMoods.filter((x) => x !== m))}><X className="w-2.5 h-2.5" /></button>
                            </span>
                          ))}
                        </div>
                        <input
                          value={motionMoodInput}
                          onChange={(e) => setMotionMoodInput(e.target.value)}
                          onKeyDown={(e) => handleMoodKeyDown(e, motionMoodInput, setMotionMoodInput, motionMoods, setMotionMoods)}
                          placeholder="Ketik mood + Enter"
                          className="w-full rounded-lg border border-border/30 bg-white/[0.02] px-3 py-2 text-[11px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/30"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-1.5 block">Target Platform</label>
                        <div className="flex gap-2">
                          {PLATFORMS.map((p) => (
                            <button
                              key={p}
                              onClick={() => setPlatform(p)}
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                                platform === p ? "bg-primary/10 text-primary border border-primary/30" : "bg-white/[0.02] border border-border/30 text-muted-foreground hover:border-border/60"
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={generateMotionPrompt}
                    disabled={!motionImage || !apiKeyValid}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-[13px] disabled:opacity-40 hover:brightness-110 transition-all"
                  >
                    Generate Motion Prompt
                  </button>
                </div>
              )}

              {step === 1 && loading && (
                <div className="flex flex-col items-center py-20 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <p className="text-[12px] text-muted-foreground/50">Membuat animation schema...</p>
                </div>
              )}

              {step === 2 && !loading && jsonOutput && (
                <OutputPanel
                  jsonOutput={jsonOutput}
                  naturalPrompt={naturalPrompt}
                  mode="motion"
                  title={`Motion: ${cameraMovement} ${duration}`}
                  inputData={{ duration, cameraMovement, motionMoods, platform }}
                  onGenerateAgain={() => { setStep(0); setJsonOutput(""); setNaturalPrompt(""); }}
                  onSaved={fetchLibrary}
                />
              )}
            </>
          )}

          {/* No API key warning */}
          {!apiKey && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center">
              <p className="text-[12px] text-destructive/80">API Key diperlukan. Simpan OpenAI atau Gemini key di <span className="font-bold">Settings</span>.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
