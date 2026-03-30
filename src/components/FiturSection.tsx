import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Users, Sparkles, Film, ImageIcon, Monitor } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import beforeProductImg from "@/assets/before-product.jpg";
import afterUgcImg from "@/assets/after-ugc.jpeg";

/* ── Character Stack Animation ────────────────────── */

const characters = [
  { name: "Hijab Casual", image: "/assets/characters/hijab-casual.jpeg" },
  { name: "Urban Trendy", image: "/assets/characters/urban-trendy.jpeg" },
  { name: "Ibu Muda", image: "/assets/characters/ibu-muda.jpeg" },
  { name: "Gen-Z Creator", image: "/assets/characters/gen-z-creator.jpeg" },
  { name: "Beauty Enthusiast", image: "/assets/characters/beauty-enthusiast.jpeg" },
  { name: "Bapak UMKM", image: "/assets/characters/bapak-umkm.jpeg" },
  { name: "Mahasiswa", image: "/assets/characters/mahasiswa.jpeg" },
  { name: "Office Worker", image: "/assets/characters/office-worker.jpeg" },
  { name: "Ibu PKK", image: "/assets/characters/ibu-pkk.jpeg" },
  { name: "Cowok Gym", image: "/assets/characters/cowok-gym.jpeg" },
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
      className="relative mx-auto h-[320px] w-full max-w-[240px] cursor-pointer"
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
            className="absolute inset-x-0 mx-auto w-[220px] select-none"
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
              <div className="relative h-[280px] overflow-hidden">
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

/* ── Before/After Reveal Slider ───────────────────── */

function BeforeAfterReveal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    setPosition(Math.max(5, Math.min(95, (x / rect.width) * 100)));
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) updatePosition(e.clientX);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    updatePosition(e.touches[0].clientX);
  };
  const stopDrag = () => setIsDragging(false);

  return (
    <div
      ref={containerRef}
      className="relative mx-auto aspect-[3/4] w-full max-w-[280px] cursor-ew-resize select-none overflow-hidden rounded-2xl border border-border/60"
      onMouseMove={handleMouseMove}
      onMouseUp={stopDrag}
      onMouseLeave={stopDrag}
      onTouchMove={handleTouchMove}
      onTouchEnd={stopDrag}
    >
      <div className="absolute inset-0">
        <img src={beforeProductImg} alt="Foto Produk" className="h-full w-full object-cover" />
      </div>
      <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${position}%)` }}>
        <img src={afterUgcImg} alt="Hasil UGC" className="h-full w-full object-cover" />
      </div>
      <div className="absolute bottom-0 top-0 z-10" style={{ left: `${position}%`, transform: "translateX(-50%)" }}>
        <div className="h-full w-[2px] bg-primary/80 shadow-[0_0_8px_hsl(var(--primary)/0.3)]" />
        <div
          className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full border-2 border-primary-foreground/20 bg-primary shadow-lg"
          onMouseDown={() => setIsDragging(true)}
          onTouchStart={() => setIsDragging(true)}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="text-primary-foreground"
          >
            <path d="M8 3l-5 9 5 9" />
            <path d="M16 3l5 9-5 9" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-3 left-3 z-20">
        <span className="rounded-md bg-background/60 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground backdrop-blur-sm">
          Produk
        </span>
      </div>
      <div className="absolute bottom-3 right-3 z-20">
        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary backdrop-blur-sm">
          UGC
        </span>
      </div>
    </div>
  );
}

/* ── Video Preview ────────────────────────────────── */

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
    <div className="relative mx-auto w-full max-w-[280px] overflow-hidden rounded-2xl border border-border/60 bg-card/80">
      <div className="relative aspect-[9/16] w-full">
        <video
          ref={videoRef}
          src="https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/showcase-videos/fitur-video.mov"
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

/* ── Screenshot/Video Placeholder ─────────────────── */
/* GANTI nanti dengan <img> atau <video> dari real screenshot */

function ScreenshotPlaceholder({ label }: { label: string }) {
  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-gradient-to-br from-card via-secondary/20 to-card border border-border/40">
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 border-b border-border/30 bg-secondary/40 px-3 py-2">
        <div className="h-2 w-2 rounded-full bg-red-500/30" />
        <div className="h-2 w-2 rounded-full bg-yellow-500/30" />
        <div className="h-2 w-2 rounded-full bg-green-500/30" />
        <div className="ml-2 flex-1 rounded bg-background/40 px-2 py-0.5 text-[8px] text-muted-foreground/30 font-mono">
          genbox.app
        </div>
      </div>
      <div className="aspect-[16/10] flex items-center justify-center">
        <div className="text-center space-y-2">
          <Monitor size={24} className="mx-auto text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground/30">{label}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Feature Data ─────────────────────────────────── */

const features = [
  {
    num: "FITUR 01",
    icon: Users,
    title: "Karakter AI Siap Pakai",
    desc: "10+ preset karakter Indonesia — hijab, casual, profesional, Gen-Z. Atau buat custom karakter sendiri.",
    screenshotLabel: "Screenshot halaman karakter",
    animation: "character-stack" as const,
  },
  {
    num: "FITUR 02",
    icon: Sparkles,
    title: "Generate Gambar UGC Realistis",
    desc: "Upload foto produk, pilih karakter dan pose. AI generate gambar UGC yang kelihatan kayak difoto beneran — bukan gambar AI yang obvious.",
    screenshotLabel: "Screenshot halaman generate",
    animation: "before-after" as const,
  },
  {
    num: "FITUR 03",
    icon: Film,
    title: "Video Siap Posting",
    desc: "Jadikan gambar UGC jadi video 5-15 detik dengan audio sinkron. Langsung upload ke TikTok dan Instagram Reels.",
    screenshotLabel: "Screenshot halaman video",
    animation: "video" as const,
  },
];

/* ── Module Card ──────────────────────────────────── */

const ModuleCard = ({
  num,
  icon: Icon,
  title,
  desc,
  screenshotLabel,
  animation,
  isVisible,
  delay,
}: {
  num: string;
  icon: typeof Users;
  title: string;
  desc: string;
  screenshotLabel: string;
  animation: "character-stack" | "before-after" | "video";
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

    {/* Full-width Screenshot/Video */}
    <div className="mt-6">
      {animation === "video" ? (
        <video
          src="https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/showcase-videos/fitur-03-video.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full rounded-xl border border-border/40 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.4)]"
        />
      ) : (
        <div className="relative w-full overflow-hidden rounded-xl border border-border/40 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-1.5 border-b border-border/30 bg-secondary/40 px-3 py-2">
            <div className="h-2 w-2 rounded-full bg-red-500/30" />
            <div className="h-2 w-2 rounded-full bg-yellow-500/30" />
            <div className="h-2 w-2 rounded-full bg-green-500/30" />
            <div className="ml-2 flex-1 rounded bg-background/40 px-2 py-0.5 text-[8px] text-muted-foreground/30 font-mono">
              genbox.app
            </div>
          </div>
          <img
            src={
              animation === "character-stack"
                ? "https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/showcase-videos/fitur-01-karakter.png"
                : "https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/showcase-videos/fitur-02-generate-v2.png"
            }
            alt={screenshotLabel}
            className="w-full"
            loading="lazy"
          />
        </div>
      )}
    </div>

    {/* Interactive animation — centered below */}
    <div className="mt-6 flex justify-center">
      {animation === "character-stack" && <CharacterStack />}
      {animation === "before-after" && <BeforeAfterReveal />}
      {animation === "video" && <VideoPreview />}
    </div>
  </div>
);

/* ── Section ──────────────────────────────────────── */

const FiturSection = () => {
  const { ref, isVisible } = useScrollReveal(0.1);

  return (
    <section id="fitur" ref={ref} className="relative z-10 px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-5xl">
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

        {/* Module cards */}
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
