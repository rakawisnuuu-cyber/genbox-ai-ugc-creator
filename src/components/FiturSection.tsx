import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Users, Sparkles, Film, ImageIcon, Monitor, Play } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

/* ── Character Showcase Stack (kept from original) ─── */

const characters = [
  {
    name: "Hijab Casual",
    image: "https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/preset-characters/Hijab%20Casual.jpeg",
  },
  {
    name: "Urban Trendy",
    image: "https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/preset-characters/Urban%20Trendy.jpeg",
  },
  {
    name: "Ibu Muda",
    image: "https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/preset-characters/Ibu%20Muda.jpeg",
  },
  {
    name: "Gen-Z Creator",
    image: "https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/preset-characters/Gen-Z%20Creator.jpeg",
  },
  {
    name: "Beauty Enthusiast",
    image:
      "https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/preset-characters/Beauty%20Enthusiast.jpeg",
  },
  {
    name: "Bapak UMKM",
    image: "https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/preset-characters/Bapak%20UMKM.jpeg",
  },
  {
    name: "Mahasiswa",
    image: "https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/preset-characters/Mahasiswa.jpeg",
  },
  {
    name: "Office Worker",
    image: "https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/preset-characters/Office%20Worker.jpeg",
  },
  {
    name: "Ibu PKK",
    image: "https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/preset-characters/Ibu%20PKK.jpeg",
  },
  {
    name: "Cowok Gym",
    image: "https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/preset-characters/Cowok%20Gym.jpeg",
  },
];

function CharacterStack() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const total = characters.length;

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => setActiveIndex((prev) => (prev + 1) % total), 3000);
    return () => clearInterval(timer);
  }, [isPaused, total]);

  return (
    <div
      className="relative mx-auto h-[340px] w-full max-w-[260px] cursor-pointer"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onClick={() => setActiveIndex((prev) => (prev + 1) % total)}
    >
      {characters.map((char, i) => {
        let pos = i - activeIndex;
        if (pos < 0) pos += total;
        if (pos > 3) return null;
        return (
          <motion.div
            key={char.name}
            className="absolute inset-x-0 mx-auto w-[240px] select-none"
            initial={false}
            animate={{
              y: pos * 14,
              scale: 1 - pos * 0.06,
              zIndex: total - pos,
              opacity: pos > 2 ? 0 : 1 - pos * 0.2,
              rotateZ: pos === 0 ? 0 : pos % 2 === 0 ? 1.5 : -1.5,
            }}
            transition={{ type: "spring", stiffness: 350, damping: 28, mass: 0.8 }}
          >
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <div className="relative h-[300px] overflow-hidden">
                <img
                  src={char.image}
                  alt={char.name}
                  className="absolute inset-0 w-full h-full object-cover object-top"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute right-2 top-2">
                  <span className="rounded bg-black/30 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-white/50 backdrop-blur-sm">
                    Preset
                  </span>
                </div>
                <div className="absolute bottom-2.5 left-2.5">
                  <p className="font-satoshi text-xs font-bold text-white drop-shadow-md">{char.name}</p>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
      <div className="absolute -bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1">
        {characters.map((_, i) => (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              setActiveIndex(i);
            }}
            className={`h-1 rounded-full transition-all duration-300 ${i === activeIndex ? "w-4 bg-primary" : "w-1 bg-foreground/15"}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Feature Module Data ──────────────────────────── */

const features = [
  {
    num: "FITUR 01",
    icon: Users,
    title: "Karakter AI Siap Pakai",
    desc: "10+ preset karakter Indonesia — hijab, casual, profesional, Gen-Z. Atau buat custom karakter sendiri.",
    visualType: "character-stack" as const,
  },
  {
    num: "FITUR 02",
    icon: Sparkles,
    title: "Generate Gambar UGC",
    desc: "Upload foto produk, pilih karakter dan pose. AI generate gambar UGC yang kelihatan kayak difoto beneran — bukan gambar AI yang obvious.",
    visualType: "screenshot" as const,
    /* GANTI nanti: */
    /* screenshotSrc: "/screenshots/generate-page.png", */
    /* atau videoSrc: "/recordings/generate-flow.mp4", */
  },
  {
    num: "FITUR 03",
    icon: Film,
    title: "Video Siap Posting",
    desc: "Jadikan gambar UGC jadi video 5-15 detik dengan audio sinkron. Langsung upload ke TikTok dan Instagram Reels.",
    visualType: "video" as const,
  },
];

/* ── Screenshot Placeholder ──────────────────────── */
/* Replace this with real <img> or <video> nanti */

function ScreenshotPlaceholder() {
  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-gradient-to-br from-card via-secondary/20 to-card">
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 border-b border-border/30 bg-secondary/40 px-3 py-2">
        <div className="h-2 w-2 rounded-full bg-red-500/30" />
        <div className="h-2 w-2 rounded-full bg-yellow-500/30" />
        <div className="h-2 w-2 rounded-full bg-green-500/30" />
        <div className="ml-2 flex-1 rounded bg-background/40 px-2 py-0.5 text-[8px] text-muted-foreground/30 font-mono">
          genbox.app/generate
        </div>
      </div>
      {/* Fake dashboard UI */}
      <div className="p-4 space-y-3">
        {/* Toolbar */}
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center">
            <Sparkles size={12} className="text-primary/50" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="h-2 w-32 rounded bg-foreground/10" />
            <div className="h-1.5 w-20 rounded bg-muted-foreground/10" />
          </div>
          <div className="h-7 w-20 rounded-md bg-primary/20 flex items-center justify-center">
            <span className="text-[8px] font-bold text-primary">Generate</span>
          </div>
        </div>
        {/* Two column: settings + preview */}
        <div className="flex gap-3">
          {/* Left: form fields */}
          <div className="flex-1 space-y-2">
            {["Produk", "Karakter", "Pose", "Model"].map((label) => (
              <div key={label} className="space-y-0.5">
                <div className="text-[7px] text-muted-foreground/30 font-medium">{label}</div>
                <div className="h-5 w-full rounded bg-secondary/60 border border-border/20" />
              </div>
            ))}
          </div>
          {/* Right: image preview grid */}
          <div className="w-[45%] grid grid-cols-2 gap-1.5">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`aspect-[3/4] rounded-lg border flex items-center justify-center ${
                  i === 0 ? "bg-primary/10 border-primary/30" : "bg-muted/20 border-border/20"
                }`}
              >
                {i === 0 && <ImageIcon size={14} className="text-primary/30" />}
              </div>
            ))}
          </div>
        </div>
        {/* Progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[7px] text-muted-foreground/30">Generating frame 3/5...</span>
            <span className="text-[7px] text-primary/50 font-mono">60%</span>
          </div>
          <div className="h-1 w-full rounded-full bg-muted/20 overflow-hidden">
            <div className="h-full w-[60%] rounded-full bg-primary/40" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Video Preview (kept from original) ──────────── */

function VideoPreview() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-border/40 bg-card/80">
      <div className="relative aspect-[9/16] max-h-[400px] w-full">
        <video
          ref={videoRef}
          src="https://uxrxrsdasgvygoeavozp.supabase.co/storage/v1/object/public/showcase-videos/fitur-video.mov"
          className="h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        />
        <span className="absolute right-3 top-3 rounded-lg bg-primary/20 px-2.5 py-1 text-[10px] font-semibold text-primary backdrop-blur-sm">
          Siap Reels
        </span>
        <button
          onClick={toggleMute}
          className="absolute bottom-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/70 backdrop-blur-sm border border-border/40 transition-colors hover:bg-background/90"
        >
          {muted ? (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

/* ── Module Card Component ───────────────────────── */

const ModuleCard = ({
  num,
  icon: Icon,
  title,
  desc,
  visualType,
  isVisible,
  delay,
}: {
  num: string;
  icon: typeof Users;
  title: string;
  desc: string;
  visualType: "character-stack" | "screenshot" | "video";
  isVisible: boolean;
  delay: number;
}) => (
  <div
    className={`rounded-3xl border border-border/60 bg-card/50 p-6 sm:p-8 transition-all duration-500 hover:border-primary/20 hover:shadow-[0_0_48px_-12px_hsl(var(--primary)/0.1)] ${isVisible ? "animate-fade-up" : "opacity-0"}`}
    style={{ animationDelay: `${delay}s` }}
  >
    {/* Header */}
    <div className="flex items-center gap-3 mb-2">
      <span className="inline-flex items-center rounded-md bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
        {num}
      </span>
      <Icon size={18} className="text-muted-foreground/40" />
    </div>

    <h3 className="font-satoshi text-xl sm:text-2xl font-bold tracking-tight text-foreground">{title}</h3>
    <p className="mt-2 font-body text-sm text-muted-foreground max-w-lg">{desc}</p>

    {/* Visual */}
    <div className="mt-6">
      {visualType === "character-stack" && (
        <div className="flex justify-center py-4">
          <CharacterStack />
        </div>
      )}
      {visualType === "screenshot" && (
        <ScreenshotPlaceholder />
        /* NANTI GANTI DENGAN:
        <img src="/screenshots/generate-page.png" alt="GENBOX Dashboard" className="w-full rounded-xl border border-border/40" />
        ATAU:
        <video src="/recordings/generate-flow.mp4" autoPlay loop muted playsInline className="w-full rounded-xl border border-border/40" />
        */
      )}
      {visualType === "video" && (
        <div className="flex justify-center">
          <div className="w-full max-w-[280px]">
            <VideoPreview />
          </div>
        </div>
      )}
    </div>
  </div>
);

/* ── Section ────────────────────────────────────────── */

const FiturSection = () => {
  const { ref, isVisible } = useScrollReveal(0.1);

  return (
    <section id="fitur" ref={ref} className="relative z-10 px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="flex justify-center">
          <div
            className={`flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-primary ${isVisible ? "animate-fade-up" : "opacity-0"}`}
            style={{ animationDelay: "0.1s" }}
          >
            Fitur Utama
          </div>
        </div>

        <h2
          className={`mx-auto mt-6 max-w-[700px] text-center font-satoshi text-[28px] font-bold leading-tight tracking-tight sm:text-[36px] lg:text-[42px] ${isVisible ? "animate-fade-up" : "opacity-0"}`}
          style={{
            animationDelay: "0.2s",
            background: "linear-gradient(180deg, hsl(60 10% 98%) 0%, hsl(220 5% 56%) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Semua yang Kamu Butuhkan untuk Konten UGC
        </h2>

        {/* Module cards — stacked vertically */}
        <div className="mt-12 space-y-6">
          {features.map((f, i) => (
            <ModuleCard key={f.num} {...f} isVisible={isVisible} delay={0.3 + i * 0.15} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FiturSection;
