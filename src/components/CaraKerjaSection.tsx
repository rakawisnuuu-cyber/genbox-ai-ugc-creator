import { useState, useEffect, useRef } from "react";
import { Upload, Users, Sparkles, Film, Play, Download, ChevronRight, Pause } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import caraKerjaProduct from "@/assets/cara-kerja-product.jpg";
import caraKerjaUgc from "@/assets/cara-kerja-ugc.jpeg";

/* ── Preset character thumbnails ── */
const characterImages = [
  "https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/preset-characters/Hijab%20Casual.jpeg",
  "https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/preset-characters/Urban%20Trendy.jpeg",
  "https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/preset-characters/Ibu%20Muda.jpeg",
  "https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/preset-characters/Gen-Z%20Creator.jpeg",
  "https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/preset-characters/Beauty%20Enthusiast.jpeg",
  "https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/preset-characters/Bapak%20UMKM.jpeg",
];

/* ── Showcase video for step 5 ── */
const SHOWCASE_VIDEO = "https://uxrxrsdasgvygoeavozp.supabase.co/storage/v1/object/public/showcase-videos/video-1.mp4";

/* ── Animated counter ── */
function useCountUp(target: number, visible: boolean, duration = 700) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const startTime = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, visible, duration]);
  return val;
}

/* ── Step 1: Upload Visual ── */
const StepUpload = () => (
  <div className="relative h-full min-h-[200px] rounded-2xl border border-border/40 bg-gradient-to-b from-card/90 to-card/50 overflow-hidden group">
    <img src={caraKerjaProduct} alt="Produk" className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105" />
    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
    <div className="relative flex flex-col items-center justify-center h-full p-4">
      <div className="animate-float rounded-2xl bg-background/80 backdrop-blur-sm p-3.5 shadow-xl border border-border/40">
        <Upload size={22} className="text-primary" />
      </div>
      <span className="mt-3 text-[11px] font-semibold text-foreground/90 tracking-wide">Drag & Drop</span>
      <span className="text-[9px] text-muted-foreground mt-0.5">JPG, PNG, WebP</span>
    </div>
  </div>
);

/* ── Step 2: Character Visual ── */
const StepCharacter = () => {
  const [selected, setSelected] = useState(1);
  return (
    <div className="h-full min-h-[200px] rounded-2xl border border-border/40 bg-gradient-to-b from-card/90 to-card/50 p-4 flex flex-col items-center justify-center">
      <div className="grid grid-cols-3 gap-2">
        {characterImages.map((img, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            className={`relative h-14 w-14 rounded-full overflow-hidden transition-all duration-300 ${
              i === selected
                ? "ring-2 ring-primary ring-offset-2 ring-offset-card scale-110 z-10"
                : "ring-1 ring-border/20 opacity-70 hover:opacity-100 hover:scale-105"
            }`}
          >
            <img src={img} alt="" className="h-full w-full object-cover object-top" loading="lazy" />
          </button>
        ))}
      </div>
    </div>
  );
};

/* ── Step 3: Generate Image Visual ── */
const StepGenerate = () => (
  <div className="relative h-full min-h-[200px] rounded-2xl border border-border/40 bg-gradient-to-b from-card/90 to-card/50 overflow-hidden group">
    <img src={caraKerjaUgc} alt="Hasil UGC" className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105" />
    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/20" />
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="rounded-full bg-primary/20 backdrop-blur-sm p-3 animate-pulse-subtle">
        <Sparkles size={20} className="text-primary drop-shadow-[0_0_12px_hsl(var(--primary)/0.6)]" />
      </div>
    </div>
  </div>
);

/* ── Step 4: Storyboard Visual ── */
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
    <div className="h-full min-h-[200px] rounded-2xl border border-border/40 bg-gradient-to-b from-card/90 to-card/50 p-4 flex flex-col items-center justify-center gap-3">
      <div className="flex items-center gap-1">
        {beats.map((beat, i) => (
          <div key={i} className="flex items-center">
            <div className={`px-2 py-1 rounded-md text-[8px] font-bold border transition-all duration-300 ${
              i === active ? `${colors[i]} scale-110` : "bg-muted/30 text-muted-foreground/50 border-border/30"
            }`}>
              {beat}
            </div>
            {i < 4 && (
              <ChevronRight size={10} className={`mx-0.5 transition-colors duration-300 ${
                i === active || i + 1 === active ? "text-primary" : "text-muted-foreground/20"
              }`} />
            )}
          </div>
        ))}
      </div>
      {/* Mini frame strip */}
      <div className="flex gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-12 w-8 rounded-md border transition-all duration-500 overflow-hidden ${
              i <= active ? "border-primary/40 bg-primary/10" : "border-border/30 bg-muted/20"
            }`}
          >
            {i <= active && (
              <img src={caraKerjaUgc} alt="" className="w-full h-full object-cover opacity-60" />
            )}
          </div>
        ))}
      </div>
      <p className="text-[9px] text-muted-foreground">5 frame • auto-generated</p>
    </div>
  );
};

/* ── Step 5: Video Visual ── */
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
    <div className="relative h-full min-h-[200px] rounded-2xl border border-primary/30 bg-gradient-to-b from-primary/5 to-card/50 overflow-hidden group">
      <video
        ref={videoRef}
        src={SHOWCASE_VIDEO}
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      {!playing && <div className="absolute inset-0 bg-background/40" />}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <button
          onClick={togglePlay}
          className={`rounded-full p-3 transition-all duration-300 ${
            playing
              ? "bg-background/60 backdrop-blur-sm opacity-0 group-hover:opacity-100"
              : "bg-primary/90 shadow-xl shadow-primary/30 animate-pulse-subtle"
          }`}
        >
          {playing ? <Pause size={18} className="text-foreground" /> : <Play size={18} className="text-primary-foreground ml-0.5" />}
        </button>
        {!playing && (
          <span className="text-[10px] font-semibold text-foreground/90 tracking-wide">Klik untuk preview</span>
        )}
      </div>
      {/* Download badge */}
      <div className="absolute bottom-3 inset-x-3">
        <div className="flex items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-[10px] font-bold tracking-wider text-primary-foreground">
          <Download size={12} />
          Siap Upload ke TikTok
        </div>
      </div>
    </div>
  );
};

/* ── Pipeline connector line ── */
const PipelineConnector = ({ active }: { active: boolean }) => (
  <div className="hidden md:flex items-center justify-center w-8 shrink-0">
    <div className="relative h-px w-full">
      <div className="absolute inset-0 bg-border/30" />
      <div className={`absolute inset-y-0 left-0 bg-primary/60 transition-all duration-1000 ${active ? "w-full" : "w-0"}`} />
      <div className={`absolute right-0 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full transition-all duration-300 ${active ? "bg-primary scale-100" : "bg-border/40 scale-75"}`} />
    </div>
  </div>
);

/* ── Step data ── */
const steps = [
  { num: 1, icon: Upload, title: "Upload Produk", desc: "Drag & drop foto produk. AI deteksi jenis produk otomatis.", visual: <StepUpload /> },
  { num: 2, icon: Users, title: "Pilih Karakter", desc: "Pilih karakter preset atau upload foto sendiri.", visual: <StepCharacter /> },
  { num: 3, icon: Sparkles, title: "Generate Gambar", desc: "AI generate gambar UGC realistis dalam 20 detik.", visual: <StepGenerate /> },
  { num: 4, icon: Film, title: "Buat Storyboard", desc: "5 frame otomatis: Hook → Build → Demo → Proof → CTA.", visual: <StepStoryboard /> },
  { num: 5, icon: Play, title: "Generate Video", desc: "Video UGC siap upload. Dengan audio & lip-sync.", visual: <StepVideo /> },
];

/* ── Main Section ── */
const CaraKerjaSection = () => {
  const { ref, isVisible } = useScrollReveal(0.1);
  const [activeStep, setActiveStep] = useState(0);

  // Auto-advance active step on scroll
  useEffect(() => {
    if (!isVisible) return;
    const t = setInterval(() => {
      setActiveStep((p) => (p < 4 ? p + 1 : p));
    }, 800);
    return () => clearInterval(t);
  }, [isVisible]);

  const nums = steps.map((s) => useCountUp(s.num, isVisible, 600 + s.num * 100));

  return (
    <section id="cara-kerja" ref={ref} className="relative z-10 px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl">
        {/* Badge */}
        <div className="flex justify-center">
          <div
            className={`flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-primary ${isVisible ? "animate-fade-up" : "opacity-0"}`}
            style={{ animationDelay: "0.1s" }}
          >
            Cara Kerja
          </div>
        </div>

        {/* Heading */}
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

        {/* Pipeline progress bar (desktop) */}
        <div
          className={`hidden md:flex items-center justify-center mt-10 mb-2 gap-1 ${isVisible ? "animate-fade-up" : "opacity-0"}`}
          style={{ animationDelay: "0.3s" }}
        >
          {steps.map((step, i) => (
            <div key={i} className="flex items-center">
              <button
                onClick={() => setActiveStep(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold transition-all duration-300 ${
                  i <= activeStep
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "bg-muted/20 text-muted-foreground/50 border border-border/20"
                }`}
              >
                <step.icon size={12} />
                {step.title}
              </button>
              {i < 4 && (
                <div className={`w-6 h-px mx-1 transition-colors duration-500 ${
                  i < activeStep ? "bg-primary/50" : "bg-border/30"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Steps Grid */}
        <div className="mt-8">
          {/* Desktop: Horizontal scroll/grid showing all 5 */}
          <div className="hidden md:grid md:grid-cols-5 gap-4">
            {steps.map((step, i) => (
              <div
                key={step.num}
                className={`flex flex-col ${isVisible ? "animate-fade-up" : "opacity-0"}`}
                style={{ animationDelay: `${0.35 + i * 0.1}s` }}
              >
                {/* Step number */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`font-mono text-[28px] font-bold leading-none transition-colors duration-500 ${
                    i <= activeStep ? "text-primary" : "text-muted-foreground/20"
                  }`}>
                    {String(nums[i]).padStart(2, "0")}
                  </span>
                </div>

                {/* Visual */}
                <div className={`transition-all duration-500 ${
                  i <= activeStep ? "opacity-100 translate-y-0" : "opacity-40 translate-y-2"
                }`}>
                  {step.visual}
                </div>

                {/* Text */}
                <h3 className="mt-3 font-satoshi text-sm font-bold text-foreground">{step.title}</h3>
                <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* Mobile: Vertical timeline */}
          <div className="md:hidden space-y-8">
            {steps.map((step, i) => (
              <div
                key={step.num}
                className={`flex gap-4 ${isVisible ? "animate-fade-up" : "opacity-0"}`}
                style={{ animationDelay: `${0.3 + i * 0.12}s` }}
              >
                {/* Timeline line + number */}
                <div className="flex flex-col items-center shrink-0">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-mono text-sm font-bold transition-colors duration-500 ${
                    i <= activeStep
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "bg-muted/20 text-muted-foreground/40 border border-border/20"
                  }`}>
                    {String(step.num).padStart(2, "0")}
                  </div>
                  {i < 4 && (
                    <div className={`w-px flex-1 mt-2 transition-colors duration-500 ${
                      i < activeStep ? "bg-primary/40" : "bg-border/30"
                    }`} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-2">
                  <h3 className="font-satoshi text-base font-bold text-foreground flex items-center gap-2">
                    <step.icon size={16} className={i <= activeStep ? "text-primary" : "text-muted-foreground/40"} />
                    {step.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">{step.desc}</p>
                  <div className="mt-3">{step.visual}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CaraKerjaSection;
