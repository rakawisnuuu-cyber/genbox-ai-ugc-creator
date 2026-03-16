import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { Monitor, Play, ImageIcon } from "lucide-react";

/* ── Feature 01: Character Showcase Stack ─────────── */

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

function CharacterShowcaseStack() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const total = characters.length;

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % total);
    }, 3000);
    return () => clearInterval(timer);
  }, [isPaused, total]);

  return (
    <div
      className="relative mx-auto h-[380px] w-full max-w-[320px] cursor-pointer"
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
            className="absolute inset-x-0 mx-auto w-[280px] select-none"
            initial={false}
            animate={{
              y: pos * 16,
              scale: 1 - pos * 0.06,
              zIndex: total - pos,
              opacity: pos > 2 ? 0 : 1 - pos * 0.2,
              rotateZ: pos === 0 ? 0 : pos % 2 === 0 ? 1.5 : -1.5,
            }}
            transition={{ type: "spring", stiffness: 350, damping: 28, mass: 0.8 }}
          >
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <div className="relative h-[340px] overflow-hidden">
                <img
                  src={char.image}
                  alt={char.name}
                  className="absolute inset-0 w-full h-full object-cover object-top"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute right-3 top-3">
                  <span className="rounded-md bg-black/30 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white/50 backdrop-blur-sm">
                    Preset
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="font-satoshi text-sm font-bold text-white drop-shadow-md">{char.name}</p>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}

      <div className="absolute -bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5">
        {characters.map((_, i) => (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              setActiveIndex(i);
            }}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIndex ? "w-5 bg-primary" : "w-1.5 bg-foreground/15"}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Feature 02: Dashboard Recording Placeholder ──── */
/* GANTI: src video dengan recording dashboard kamu nanti */
/* Untuk sekarang pakai placeholder visual */

function DashboardShowcase() {
  return (
    <div className="mx-auto w-full max-w-[320px] overflow-hidden rounded-2xl border border-border/60 bg-card/80">
      {/* Browser chrome mockup */}
      <div className="flex items-center gap-1.5 border-b border-border/40 bg-secondary/50 px-3 py-2">
        <div className="h-2 w-2 rounded-full bg-red-500/40" />
        <div className="h-2 w-2 rounded-full bg-yellow-500/40" />
        <div className="h-2 w-2 rounded-full bg-green-500/40" />
        <div className="ml-2 flex-1 rounded bg-background/50 px-2 py-0.5 text-[8px] text-muted-foreground/40">
          genbox.app/generate
        </div>
      </div>

      {/* Placeholder — replace this div with <video> or <img> of real dashboard */}
      <div className="relative aspect-[4/3] w-full bg-gradient-to-br from-card via-secondary/30 to-card flex flex-col items-center justify-center gap-3">
        {/* Fake dashboard grid */}
        <div className="w-[85%] space-y-2">
          {/* Top bar mockup */}
          <div className="flex items-center gap-2">
            <div className="h-2 w-16 rounded bg-primary/20" />
            <div className="flex-1" />
            <div className="h-6 w-20 rounded-md bg-primary/15 flex items-center justify-center">
              <span className="text-[7px] font-bold text-primary">Generate</span>
            </div>
          </div>
          {/* Image grid mockup */}
          <div className="grid grid-cols-3 gap-1.5">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`aspect-[3/4] rounded-lg ${
                  i < 3 ? "bg-primary/10 border border-primary/20" : "bg-muted/30 border border-border/20"
                } flex items-center justify-center`}
              >
                {i < 3 && <ImageIcon size={10} className="text-primary/30" />}
              </div>
            ))}
          </div>
          {/* Progress bar */}
          <div className="h-1.5 w-full rounded-full bg-muted/30 overflow-hidden">
            <div className="h-full w-[65%] rounded-full bg-primary/40 animate-pulse" />
          </div>
        </div>

        {/* Overlay label */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-center gap-1.5 rounded-lg bg-background/80 backdrop-blur-sm py-2 border border-border/40">
          <Monitor size={12} className="text-primary" />
          <span className="text-[10px] font-semibold text-muted-foreground">Dashboard Preview</span>
        </div>
      </div>
    </div>
  );
}

/* ── Feature 03: Real Video Preview ───────────────── */

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
    <div className="mx-auto w-full max-w-[320px] overflow-hidden rounded-2xl border border-border/60 bg-card/80">
      <div className="relative aspect-[9/16] w-full">
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
          aria-label={muted ? "Unmute" : "Mute"}
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

/* ── Feature Data ───────────────────────────────────── */

const features = [
  {
    num: "01",
    title: "10+ Karakter AI Siap Pakai",
    desc: "Pilih karakter sesuai target market kamu — hijab, casual, profesional, Gen-Z. Atau buat custom karakter sendiri.",
    visual: <CharacterShowcaseStack />,
    reversed: false,
  },
  {
    num: "02",
    title: "Generate Gambar UGC Realistis",
    desc: "Upload foto produk, pilih karakter, AI generate gambar UGC yang kelihatan kayak difoto beneran pakai HP. Bukan gambar AI yang obvious.",
    visual: <DashboardShowcase />,
    reversed: true,
  },
  {
    num: "03",
    title: "Video Siap Posting ke TikTok",
    desc: "Ubah gambar UGC jadi video 5-15 detik dengan audio. Langsung upload ke TikTok dan Instagram Reels.",
    visual: <VideoPreview />,
    reversed: false,
  },
];

/* ── Feature Row Component ───────────────────────────── */

const FeatureRow = ({
  num,
  title,
  desc,
  visual,
  reversed,
  isVisible,
  delay,
}: {
  num: string;
  title: string;
  desc: string;
  visual: React.ReactNode;
  reversed: boolean;
  isVisible: boolean;
  delay: number;
}) => (
  <div
    className={`relative py-10 ${isVisible ? "animate-fade-up" : "opacity-0"}`}
    style={{ animationDelay: `${delay}s` }}
  >
    {/* Timeline dot */}
    <div className="absolute left-[20px] top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 lg:left-1/2">
      <div className="h-3.5 w-3.5 rounded-full border-2 border-primary bg-background ring-[6px] ring-primary/10" />
    </div>

    {/* Content */}
    <div
      className={`flex flex-col gap-8 pl-12 lg:flex-row lg:items-center lg:gap-12 lg:pl-0 ${reversed ? "lg:flex-row-reverse" : ""}`}
    >
      {/* Text side */}
      <div className={`flex-1 ${reversed ? "lg:text-left lg:pl-12" : "lg:pr-12 lg:text-right"}`}>
        <span className="font-mono text-[32px] font-bold leading-none text-primary/40">{num}</span>
        <h3 className="mt-2 font-satoshi text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h3>
        <p className="mt-2 font-body text-base text-muted-foreground">{desc}</p>
      </div>
      {/* Visual side */}
      <div className={`flex-1 ${reversed ? "lg:pr-12 lg:flex lg:justify-end" : "lg:pl-12"}`}>
        <div className="w-full max-w-sm">{visual}</div>
      </div>
    </div>
  </div>
);

/* ── Section ────────────────────────────────────────── */

const FiturSection = () => {
  const { ref, isVisible } = useScrollReveal(0.15);

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

        {/* Timeline container */}
        <div className="relative mt-14">
          {/* Vertical line */}
          <div className="absolute bottom-0 left-[20px] top-0 w-px bg-gradient-to-b from-transparent via-border/60 to-transparent lg:left-1/2 lg:-translate-x-1/2" />

          {features.map((f, i) => (
            <FeatureRow key={f.num} {...f} isVisible={isVisible} delay={0.3 + i * 0.15} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FiturSection;
