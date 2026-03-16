import { useState, useEffect } from "react";
import { Lightbulb, ArrowRight } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const providerColors: Record<string, string> = {
  GOOGLE: "bg-green-400",
  BYTEDANCE: "bg-blue-400",
};

const typeBadge: Record<string, string> = {
  IMAGE: "bg-blue-500/20 text-blue-400",
  VIDEO: "bg-red-500/20 text-red-400",
  PROMPT: "bg-purple-500/20 text-purple-400",
};

const highlights = [
  {
    name: "Nano Banana 2 (2K)",
    provider: "GOOGLE",
    type: "IMAGE",
    price: "~Rp 960",
    unit: "/gambar",
    note: "Resolusi default GENBOX",
  },
  {
    name: "Seedream 5.0 Lite",
    provider: "BYTEDANCE",
    type: "IMAGE",
    price: "~Rp 440",
    unit: "/gambar",
    note: "Opsi paling hemat",
  },
  {
    name: "Veo 3.1 Fast (8s)",
    provider: "GOOGLE",
    type: "VIDEO",
    price: "~Rp 6.400",
    unit: "/video",
    note: "Dengan audio sinkron, 1080p",
  },
  {
    name: "Gemini 2.0 Flash",
    provider: "GOOGLE",
    type: "PROMPT",
    price: "GRATIS",
    unit: "",
    note: "Rekomendasi untuk prompt",
    isFree: true,
  },
];

function AnimatedNumber({ target, visible }: { target: number; visible: boolean }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const duration = 1200;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(eased * target));
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
    models: "Nano Banana 2 (1K) + Grok 6s",
    calc: "(50 × Rp 640) + (5 × Rp 1.600)",
    total: 40000,
    vs: "vs. hire fotografer: Rp 500.000+",
  },
  {
    title: "Aktif",
    desc: "200 gambar + 20 video / bulan",
    models: "Nano Banana 2 (2K) + Seedance 8s",
    calc: "(200 × Rp 960) + (20 × Rp 4.480)",
    total: 281600,
    vs: "vs. content agency: Rp 3.000.000+",
  },
  {
    title: "Power User",
    desc: "500 gambar + 50 video / bulan",
    models: "Nano Banana 2 (2K) + Veo 3.1 Fast",
    calc: "(500 × Rp 960) + (50 × Rp 6.400)",
    total: 800000,
    vs: "vs. full production: Rp 10.000.000+",
  },
];

const ApiCostSection = () => {
  const { ref, isVisible } = useScrollReveal();
  const { ref: simRef, isVisible: simVisible } = useScrollReveal();

  return (
    <section id="api-cost" className="relative py-16 sm:py-24 overflow-hidden">
      <div ref={ref} className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
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
          Sistem BYOK — pakai API key sendiri, biaya generation tetap murah dan transparan.
        </p>

        {/* Highlight cards */}
        <div
          className={`mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${isVisible ? "animate-fade-up" : "opacity-0"}`}
          style={{ animationDelay: "0.4s" }}
        >
          {highlights.map((m) => (
            <div
              key={m.name}
              className="rounded-2xl border border-border/60 bg-card/50 p-5 transition-all duration-300 hover:border-primary/20 hover:bg-card/80"
            >
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${providerColors[m.provider] || "bg-gray-400"}`} />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                  {m.provider}
                </span>
              </div>
              <p className="mt-3 font-satoshi text-sm font-bold text-foreground">{m.name}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{m.note}</p>
              <p className={`mt-3 font-mono text-lg font-bold ${m.isFree ? "text-primary" : "text-foreground"}`}>
                {m.price}
                <span className="text-xs font-normal text-muted-foreground">{m.unit}</span>
              </p>
              <span
                className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${typeBadge[m.type]}`}
              >
                {m.type}
              </span>
            </div>
          ))}
        </div>

        {/* View all link */}
        <div
          className={`mt-6 text-center ${isVisible ? "animate-fade-up" : "opacity-0"}`}
          style={{ animationDelay: "0.5s" }}
        >
          <button className="inline-flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-primary/80">
            Lihat semua 21+ model tersedia
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Cost Simulator */}
        <div
          ref={simRef}
          className={`mt-14 rounded-2xl border border-border/60 bg-card/50 p-6 sm:p-8 ${simVisible ? "animate-fade-up" : "opacity-0"}`}
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
            * Harga berdasarkan Kie.ai credit rate. Kurs ~Rp 16.000/$. Gemini Flash untuk prompt gratis.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ApiCostSection;
