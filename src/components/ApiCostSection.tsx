import { useState, useEffect } from "react";
import { Lightbulb } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

type ModelType = "IMAGE" | "VIDEO" | "MUSIC" | "PROMPT";
type TabFilter = "ALL" | ModelType;

interface Model {
  name: string;
  note?: string;
  provider: string;
  type: ModelType;
  credits: string;
  price: string;
  discount?: string;
  freePrice?: boolean;
}

const providerColors: Record<string, string> = {
  GOOGLE: "bg-green-400",
  OPENAI: "bg-white",
  BYTEDANCE: "bg-blue-400",
  "BLACK FOREST LABS": "bg-purple-400",
  KLING: "bg-orange-400",
  RUNWAY: "bg-pink-400",
  HAILUO: "bg-cyan-400",
  SUNO: "bg-fuchsia-400",
  ELEVENLABS: "bg-violet-400",
  ANTHROPIC: "bg-orange-300",
};

const typeBadge: Record<ModelType, string> = {
  IMAGE: "bg-blue-500/20 text-blue-400",
  VIDEO: "bg-red-500/20 text-red-400",
  MUSIC: "bg-fuchsia-500/20 text-fuchsia-400",
  PROMPT: "bg-purple-500/20 text-purple-400",
};

const models: Model[] = [
  { name: "Nano Banana 2 (Gemini 3.1 Flash Image) — 1K", note: "NEW — sub-second, subject consistency", provider: "GOOGLE", type: "IMAGE", credits: "8", price: "$0.04 (~Rp 640)" },
  { name: "Nano Banana 2 (Gemini 3.1 Flash Image) — 2K", note: "Default GENBOX resolution", provider: "GOOGLE", type: "IMAGE", credits: "12", price: "$0.06 (~Rp 960)" },
  { name: "Nano Banana 2 (Gemini 3.1 Flash Image) — 4K", note: "Ultra HD output", provider: "GOOGLE", type: "IMAGE", credits: "18", price: "$0.09 (~Rp 1.440)" },
  { name: "Nano Banana Pro (Gemini 3.0 Pro Image) — 2K", note: "Multi-turn editing, deep reasoning", provider: "GOOGLE", type: "IMAGE", credits: "18", price: "$0.09 (~Rp 1.440)" },
  { name: "Nano Banana Pro (Gemini 3.0 Pro Image) — 4K", note: "4K, multi-turn editing, deep reasoning", provider: "GOOGLE", type: "IMAGE", credits: "24", price: "$0.12 (~Rp 1.920)" },
  { name: "Seedream 5.0 Lite", note: "Text/image-to-image, NEW", provider: "BYTEDANCE", type: "IMAGE", credits: "5.5", price: "$0.0275 (~Rp 440)" },
  { name: "GPT Image 1.5", note: "#1 leaderboard, tiered quality", provider: "OPENAI", type: "IMAGE", credits: "~12", price: "~$0.04-0.08 (~Rp 640-1.280)" },
  { name: "4o Image (GPT-Image-1)", provider: "OPENAI", type: "IMAGE", credits: "10", price: "$0.05 (~Rp 800)" },
  { name: "Flux.1 Kontext", note: "Context-aware editing", provider: "BLACK FOREST LABS", type: "IMAGE", credits: "6", price: "$0.03 (~Rp 480)" },
  { name: "Grok Imagine (6s, 720p)", note: "Text/image-to-video, hemat", provider: "GOOGLE", type: "VIDEO", credits: "20", price: "$0.10 (~Rp 1.600)" },
  { name: "Veo 3.1 Fast (8s, with audio)", note: "Synced audio, 1080p", provider: "GOOGLE", type: "VIDEO", credits: "80", price: "$0.40 (~Rp 6.400)", discount: "-60%" },
  { name: "Veo 3 Quality (8s, with audio)", note: "Premium cinematic", provider: "GOOGLE", type: "VIDEO", credits: "400", price: "$2.00 (~Rp 32.000)" },
  { name: "Kling 3.0 (5s, 720p, no audio)", provider: "KLING", type: "VIDEO", credits: "100", price: "$0.50 (~Rp 8.000)" },
  { name: "Kling 3.0 (5s, 720p, with audio)", provider: "KLING", type: "VIDEO", credits: "150", price: "$0.75 (~Rp 12.000)" },
  { name: "Seedance 1.5 Pro (8s, with audio)", provider: "BYTEDANCE", type: "VIDEO", credits: "56", price: "$0.28 (~Rp 4.480)", discount: "-32%" },
  { name: "Hailuo (MiniMax)", provider: "HAILUO", type: "VIDEO", credits: "~50", price: "~$0.25 (~Rp 4.000)" },
  { name: "Runway Gen-4 Turbo", provider: "RUNWAY", type: "VIDEO", credits: "~100", price: "~$0.50 (~Rp 8.000)" },
  { name: "Suno V4.5 Plus", note: "Up to 8 min, vocals + instrumentals", provider: "SUNO", type: "MUSIC", credits: "~20", price: "~$0.10 (~Rp 1.600)" },
  { name: "ElevenLabs V3 TTS", note: "Text-to-dialogue, voice cloning", provider: "ELEVENLABS", type: "MUSIC", credits: "14/1k chars", price: "$0.07 (~Rp 1.120)" },
  { name: "Gemini 2.0 Flash", note: "Recommended for GENBOX prompts", provider: "GOOGLE", type: "PROMPT", credits: "0", price: "FREE", freePrice: true },
  { name: "Claude Sonnet", provider: "ANTHROPIC", type: "PROMPT", credits: "~2", price: "~$0.01 (~Rp 160)" },
];

const tabs: TabFilter[] = ["ALL", "IMAGE", "VIDEO", "MUSIC", "PROMPT"];

function AnimatedNumber({ target, visible }: { target: number; visible: boolean }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const duration = 1200;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(eased * target);
      setVal(start);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, visible]);
  return <>{val.toLocaleString("id-ID")}</>;
}

const simCards = [
  {
    title: "Pemula",
    desc: "50 gambar + 5 video / bulan",
    models: "Pakai: Nano Banana 2 + Kling Standard",
    calc: "(50 × Rp 320) + (5 × Rp 2.240)",
    total: 27200,
    vs: "vs. hire fotografer: Rp 500.000+",
  },
  {
    title: "Aktif",
    desc: "200 gambar + 20 video / bulan",
    models: "Pakai: Nano Banana 2 + Seedance 8s",
    calc: "(200 × Rp 320) + (20 × Rp 4.480)",
    total: 153600,
    vs: "vs. content agency: Rp 3.000.000+",
  },
  {
    title: "Power User",
    desc: "500 gambar + 50 video / bulan",
    models: "Pakai: Seedream 4.5 + Veo 3.1 Fast",
    calc: "(500 × Rp 400) + (50 × Rp 4.800)",
    total: 440000,
    vs: "vs. full production: Rp 10.000.000+",
  },
];

const ApiCostSection = () => {
  const { ref, isVisible } = useScrollReveal();
  const { ref: simRef, isVisible: simVisible } = useScrollReveal();
  const [activeTab, setActiveTab] = useState<TabFilter>("ALL");

  const filtered = activeTab === "ALL" ? models : models.filter((m) => m.type === activeTab);

  return (
    <section id="api-cost" className="relative py-16 sm:py-24 overflow-hidden">
      <div ref={ref} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Badge */}
        <div
          className={`flex justify-center mb-6 ${isVisible ? "animate-fade-up" : "opacity-0"}`}
          style={{ animationDelay: "0.1s" }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-primary">
            Biaya API Transparan
          </span>
        </div>

        <h2
          className={`text-center font-satoshi text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground ${isVisible ? "animate-fade-up" : "opacity-0"}`}
          style={{ animationDelay: "0.2s" }}
        >
          Kamu yang Kontrol Biaya
        </h2>
        <p
          className={`mt-4 text-center text-base text-muted-foreground max-w-xl mx-auto ${isVisible ? "animate-fade-up" : "opacity-0"}`}
          style={{ animationDelay: "0.3s" }}
        >
          Sebagai pengguna BYOK, kamu bayar langsung ke provider via Kie.ai. 1 credit = $0.005.
        </p>

        {/* Tab filter */}
        <div
          className={`mt-10 flex flex-wrap justify-center gap-2 ${isVisible ? "animate-fade-up" : "opacity-0"}`}
          style={{ animationDelay: "0.35s" }}
        >
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${
                activeTab === t
                  ? "bg-primary text-primary-foreground"
                  : "border border-border/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Table */}
        <div
          className={`mt-8 overflow-hidden rounded-2xl border border-border/60 bg-card/80 ${isVisible ? "animate-fade-up" : "opacity-0"}`}
          style={{ animationDelay: "0.4s" }}
        >
           <div className="overflow-x-auto scrollbar-none">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="sticky top-0 z-20">
                <tr className="bg-secondary/50">
                  <th className="sticky left-0 z-30 bg-secondary/50 min-w-[200px] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                    Model Name
                  </th>
                  <th className="bg-secondary/50 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                    Provider
                  </th>
                  <th className="bg-secondary/50 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                    Type
                  </th>
                  <th className="bg-secondary/50 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                    Credits
                  </th>
                  <th className="bg-secondary/50 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                    Est. Price
                  </th>
                </tr>
              </thead>
            </table>
            <div className="max-h-[420px] overflow-y-auto scrollbar-none">
              <table className="w-full min-w-[700px] text-sm">
                <tbody>
                  {filtered.map((m, i) => (
                    <tr
                      key={m.name}
                      className={`${
                        i % 2 === 0 ? "bg-card/60" : "bg-card/30"
                      } transition-colors hover:bg-secondary/60`}
                    >
                      <td className="sticky left-0 z-10 min-w-[200px] px-4 py-3 bg-inherit">
                        <span className="font-medium text-foreground">{m.name}</span>
                        {m.discount && (
                          <span className="ml-2 inline-flex rounded-full bg-red-500/20 px-2 text-[10px] font-bold text-red-400">
                            {m.discount}
                          </span>
                        )}
                        {m.note && (
                          <span className="block text-[11px] text-muted-foreground mt-0.5">{m.note}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className={`h-2 w-2 rounded-full ${providerColors[m.provider] || "bg-gray-400"}`} />
                          {m.provider}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${typeBadge[m.type]}`}>
                          {m.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{m.credits}</td>
                      <td className={`px-4 py-3 text-xs ${m.freePrice ? "font-bold text-primary" : "text-muted-foreground"}`}>
                        {m.price}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border/60 px-4 py-3">
            <span className="text-[11px] text-muted-foreground/50">{filtered.length} MODELS LOADED</span>
            <span className="flex items-center gap-2 text-[11px] text-muted-foreground/50">
              LIVE API FEED
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse-subtle" />
            </span>
          </div>
        </div>

        {/* Cost Simulator */}
        <div
          ref={simRef}
          className={`mt-12 rounded-2xl border border-border/60 bg-card/80 p-6 sm:p-8 ${simVisible ? "animate-fade-up" : "opacity-0"}`}
          style={{ animationDelay: "0.2s" }}
        >
          <h3 className="flex items-center justify-center gap-2 font-satoshi text-lg font-bold tracking-tight text-foreground">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
              <Lightbulb size={16} className="text-primary" />
            </span>
            Simulasi Biaya Bulanan
          </h3>

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {simCards.map((c) => (
              <div key={c.title} className="rounded-2xl border border-border/60 bg-secondary/50 p-5">
                <p className="font-satoshi text-base font-bold text-foreground">{c.title}</p>
                <p className="mt-2 text-xs text-muted-foreground">{c.desc}</p>
                <p className="mt-1 text-xs text-muted-foreground">{c.models}</p>
                <p className="mt-2 font-mono text-[11px] text-muted-foreground">{c.calc}</p>
                <p className="mt-3 text-lg font-bold text-primary">
                  = Rp <AnimatedNumber target={c.total} visible={simVisible} />
                  <span className="text-sm font-normal text-muted-foreground">/bulan</span>
                </p>
                <p className="mt-2 text-xs text-muted-foreground line-through">{c.vs}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-[11px] text-muted-foreground leading-relaxed">
            * Harga berdasarkan Kie.ai credit rate $0.005/credit. Kurs Rp 16.000/$. Harga dapat berubah sesuai provider. Gemini Flash untuk prompt gratis.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ApiCostSection;
