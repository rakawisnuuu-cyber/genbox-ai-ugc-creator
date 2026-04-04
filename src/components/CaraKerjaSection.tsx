import { useState, useEffect, useRef } from "react";
import { Upload, Users, Sparkles, Film, Download } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import caraKerjaProduct from "@/assets/cara-kerja-product.jpg";
import caraKerjaUgc from "@/assets/cara-kerja-ugc-new.jpeg";

const PRESET_BASE = "https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/preset-characters";

const characterImages = [
  `${PRESET_BASE}/hijab-casual.jpeg`,
  `${PRESET_BASE}/urban-trendy.jpeg`,
  `${PRESET_BASE}/ibu-muda.jpeg`,
  `${PRESET_BASE}/gen-z-creator.jpeg`,
  `${PRESET_BASE}/beauty-enthusiast.jpeg`,
  `${PRESET_BASE}/bapak-umkm.jpeg`,
];

const SHOWCASE_VIDEO = "/showcase/cara-kerja-video.mp4";

/* ── Step Visuals ── */

const StepUpload = () => (
  <div className="relative aspect-[4/3] rounded-xl border border-border/40 bg-gradient-to-b from-card/90 to-card/50 overflow-hidden group">
    <img
      src={caraKerjaProduct}
      alt="Produk"
      className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
    <div className="relative flex flex-col items-center justify-center h-full p-4">
      <div className="animate-float rounded-xl bg-background/80 backdrop-blur-sm p-3 shadow-xl border border-border/40">
        <Upload size={18} className="text-primary" />
      </div>
      <span className="mt-2 text-[10px] font-semibold text-foreground/90">Drag & Drop</span>
    </div>
  </div>
);

const StepCharacter = () => {
  const [selected, setSelected] = useState(1);
  return (
    <div className="aspect-[4/3] rounded-xl border border-border/40 bg-gradient-to-b from-card/90 to-card/50 p-3 flex flex-col items-center justify-center">
      <div className="grid grid-cols-3 gap-1.5">
        {characterImages.map((img, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            className={`relative h-11 w-11 rounded-full overflow-hidden transition-all duration-300 ${
              i === selected
                ? "ring-2 ring-primary ring-offset-1 ring-offset-card scale-110 z-10"
                : "ring-1 ring-border/20 opacity-60 hover:opacity-100"
            }`}
          >
            <img src={img} alt="" className="h-full w-full object-cover object-top" loading="lazy" />
          </button>
        ))}
      </div>
    </div>
  );
};

const StepStoryboard = () => {
  const beats = ["Hook", "Build", "Demo", "Proof", "CTA"];
  const colors = [
    "bg-red-500/20 text-red-400 border-red-500/30",
    "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "bg-green-500/20 text-green-400 border-green-500/30",
    "bg-purple-500/20 text-purple-400 border-purple-500/30",
    "bg-amber-500/20 text-amber-400 border-amber-500/30",
  ];
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((p) => (p + 1) % 5), 1200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="aspect-[4/3] rounded-xl border border-border/40 bg-gradient-to-b from-card/90 to-card/50 p-3 flex flex-col items-center justify-center gap-2.5">
      <div className="flex items-center gap-1">
        {beats.map((beat, i) => (
          <div
            key={i}
            className={`px-1.5 py-0.5 rounded text-[7px] font-bold border transition-all duration-300 ${
              i === active ? `${colors[i]} scale-110` : "bg-muted/30 text-muted-foreground/50 border-border/30"
            }`}
          >
            {beat}
          </div>
        ))}
      </div>
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-10 w-7 rounded border transition-all duration-500 overflow-hidden ${
              i <= active ? "border-primary/40 bg-primary/10" : "border-border/30 bg-muted/20"
            }`}
          >
            {i <= active && <img src={caraKerjaUgc} alt="" className="w-full h-full object-cover opacity-60" />}
          </div>
        ))}
      </div>
      <p className="text-[8px] text-muted-foreground">5 frame · auto-generated</p>
    </div>
  );
};

const StepGenerate = () => (
  <div className="relative aspect-[4/3] rounded-xl border border-border/40 bg-gradient-to-b from-card/90 to-card/50 overflow-hidden group">
    <img
      src={caraKerjaUgc}
      alt="Hasil UGC"
      className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/20" />
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="rounded-full bg-primary/20 backdrop-blur-sm p-2.5 animate-pulse-subtle">
        <Sparkles size={16} className="text-primary drop-shadow-[0_0_12px_hsl(var(--primary)/0.6)]" />
      </div>
    </div>
  </div>
);

const StepVideo = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
    setPlaying(!playing);
  };

  return (
    <div className="relative aspect-[4/3] rounded-xl border border-primary/30 bg-gradient-to-b from-primary/5 to-card/50 overflow-hidden group">
      <video
        ref={videoRef}
        src={SHOWCASE_VIDEO}
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      {!playing && <div className="absolute inset-0 bg-background/40" />}
      <div className="absolute inset-0 flex items-center justify-center">
        <button
          onClick={togglePlay}
          className={`rounded-full p-2.5 transition-all duration-300 ${
            playing
              ? "bg-background/60 backdrop-blur-sm opacity-0 group-hover:opacity-100"
              : "bg-primary/90 shadow-xl shadow-primary/30 animate-pulse-subtle"
          }`}
        >
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-primary-foreground ml-0.5">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

/* ── Step data ── */
const steps = [
  { num: "01", icon: Upload, title: "Upload Produk", desc: "Drop foto produk. AI analisa jenis produk otomatis.", visual: <StepUpload /> },
  { num: "02", icon: Users, title: "Pilih Karakter", desc: "10+ preset karakter Indonesia atau buat sendiri.", visual: <StepCharacter /> },
  { num: "03", icon: Film, title: "Buat Storyboard", desc: "AI generate 5-frame storyboard: Hook → Build → Demo → Proof → CTA.", visual: <StepStoryboard /> },
  { num: "04", icon: Sparkles, title: "Generate Gambar", desc: "Gambar UGC realistis per-frame. Konsisten di semua frame.", visual: <StepGenerate /> },
  { num: "05", icon: Download, title: "Buat Video", desc: "Video UGC siap posting ke TikTok dan Instagram Reels.", visual: <StepVideo /> },
];

/* ── Main Section ── */
const CaraKerjaSection = () => {
  const { ref, isVisible } = useScrollReveal(0.1);

  return (
    <section id="cara-kerja" ref={ref} className="relative z-10 px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="flex justify-center">
          <div
            className={`flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-primary ${isVisible ? "animate-fade-up" : "opacity-0"}`}
            style={{ animationDelay: "0.1s" }}
          >
            Cara Kerja
          </div>
        </div>

        <h2
          className={`mt-5 text-center font-satoshi text-[28px] font-bold leading-tight tracking-tight sm:text-[36px] lg:text-[42px] ${isVisible ? "animate-fade-up" : "opacity-0"}`}
          style={{
            animationDelay: "0.2s",
            background: "linear-gradient(180deg, hsl(60 10% 98%) 0%, hsl(220 5% 56%) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Dari Foto Produk ke Video UGC
        </h2>
        <p
          className={`mt-3 text-center font-body text-base text-muted-foreground sm:text-lg ${isVisible ? "animate-fade-up" : "opacity-0"}`}
          style={{ animationDelay: "0.25s" }}
        >
          5 langkah — semua powered by AI, tanpa model, tanpa studio
        </p>

        {/* Desktop: uniform 5-column grid */}
        <div className="mt-12 hidden md:grid md:grid-cols-5 gap-4">
          {steps.map((step, i) => (
            <div key={step.num} className={`${isVisible ? "animate-fade-up" : "opacity-0"}`} style={{ animationDelay: `${0.35 + i * 0.08}s` }}>
              <div className="flex items-center gap-1.5 mb-2.5">
                <span className="font-mono text-[20px] font-bold leading-none text-primary/30">{step.num}</span>
                <step.icon size={13} className="text-primary/50" />
              </div>
              {step.visual}
              <h3 className="mt-2.5 font-satoshi text-[13px] font-bold text-foreground">{step.title}</h3>
              <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Mobile: Vertical timeline */}
        <div className="mt-10 md:hidden space-y-8">
          {steps.map((step, i) => (
            <div key={step.num} className={`flex gap-4 ${isVisible ? "animate-fade-up" : "opacity-0"}`} style={{ animationDelay: `${0.3 + i * 0.1}s` }}>
              <div className="flex flex-col items-center shrink-0">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-primary/15 text-primary border border-primary/30">
                  <step.icon size={18} />
                </div>
                {i < 4 && <div className="w-px flex-1 mt-2 bg-primary/20" />}
              </div>
              <div className="flex-1 pb-2">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-primary/50">Langkah {step.num}</span>
                <h3 className="mt-1 font-satoshi text-base font-bold text-foreground">{step.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{step.desc}</p>
                <div className="mt-3">{step.visual}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CaraKerjaSection;
