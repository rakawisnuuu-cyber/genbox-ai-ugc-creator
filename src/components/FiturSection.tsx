import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import beforeProductImg from "@/assets/before-product.jpg";
import afterUgcImg from "@/assets/after-ugc.jpeg";

/* ── Feature 01: Character Showcase Stack ─────────── */

const characters = [
  { name: "Hijab Casual", desc: "Wanita · 20-25 · Modern", gradient: "from-emerald-600 to-teal-400", image: "https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/preset-characters/Hijab%20Casual.jpeg" },
  { name: "Urban Trendy", desc: "Pria · 22-28 · Streetwear", gradient: "from-violet-600 to-purple-400", image: "https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/preset-characters/Urban%20Trendy.jpeg" },
  { name: "Ibu Muda", desc: "Wanita · 25-35 · Friendly", gradient: "from-rose-500 to-pink-400", image: "https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/preset-characters/Ibu%20Muda.jpeg" },
  { name: "Gen-Z Creator", desc: "Pria/Wanita · 17-22 · Trendy", gradient: "from-cyan-500 to-sky-400", image: "https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/preset-characters/Gen-Z%20Creator.jpeg" },
  { name: "Beauty Enthusiast", desc: "Wanita · 20-30 · Glowing", gradient: "from-fuchsia-500 to-pink-400", image: "https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/preset-characters/Beauty%20Enthusiast.jpeg" },
  { name: "Bapak UMKM", desc: "Pria · 35-50 · Profesional", gradient: "from-slate-500 to-zinc-400", image: "https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/preset-characters/Bapak%20UMKM.jpeg" },
  { name: "Mahasiswa", desc: "Pria/Wanita · 18-22 · Energik", gradient: "from-amber-500 to-orange-400", image: "https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/preset-characters/Mahasiswa.jpeg" },
  { name: "Office Worker", desc: "Pria/Wanita · 25-35 · Smart Casual", gradient: "from-gray-500 to-neutral-400", image: "https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/preset-characters/Office%20Worker.jpeg" },
  { name: "Ibu PKK", desc: "Wanita · 35-50 · Ramah", gradient: "from-green-500 to-lime-400", image: "https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/preset-characters/Ibu%20PKK.jpeg" },
  { name: "Cowok Gym", desc: "Pria · 22-30 · Athletic", gradient: "from-red-500 to-orange-400", image: "https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/preset-characters/Cowok%20Gym.jpeg" },
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
        const isTop = pos === 0;

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
            <div className={`rounded-2xl bg-gradient-to-br ${char.gradient} overflow-hidden border border-white/10 shadow-2xl`}>
              <div className="relative h-[260px] overflow-hidden">
                {char.image && (
                  <img src={char.image} alt={char.name} className="absolute inset-0 w-full h-full object-cover object-top" loading="lazy" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute right-3 top-3">
                  <span className="rounded-md bg-black/30 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white/50 backdrop-blur-sm">Preset</span>
                </div>
              </div>
              <div className="bg-black/20 p-4 backdrop-blur-sm">
                <p className="font-satoshi text-sm font-bold text-white">{char.name}</p>
                <p className="mt-0.5 text-[11px] text-white/50">{char.desc}</p>
                {isTop && (
                  <motion.div
                    className="mt-3 flex gap-2"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    <div className="flex h-8 flex-1 items-center justify-center rounded-lg bg-white/20">
                      <span className="text-[10px] font-semibold text-white/80 flex items-center gap-1">Gunakan <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span>
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="opacity-50">
                        <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
                      </svg>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}

      <div className="absolute -bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5">
        {characters.map((_, i) => (
          <button
            key={i}
            onClick={(e) => { e.stopPropagation(); setActiveIndex(i); }}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIndex ? "w-5 bg-primary" : "w-1.5 bg-foreground/15"}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Feature 02: Before/After Reveal Slider ───────── */

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

  const handleMouseMove = (e: React.MouseEvent) => { if (isDragging) updatePosition(e.clientX); };
  const handleTouchMove = (e: React.TouchEvent) => { updatePosition(e.touches[0].clientX); };
  const stopDrag = () => setIsDragging(false);

  return (
    <div
      ref={containerRef}
      className="relative mx-auto aspect-[3/4] w-full max-w-[320px] cursor-ew-resize select-none overflow-hidden rounded-2xl border border-border/60"
      onMouseMove={handleMouseMove}
      onMouseUp={stopDrag}
      onMouseLeave={stopDrag}
      onTouchMove={handleTouchMove}
      onTouchEnd={stopDrag}
    >
      {/* Before — Product */}
      <div className="absolute inset-0">
        <img src={beforeProductImg} alt="Foto Produk" className="h-full w-full object-cover" />
      </div>

      {/* After — UGC */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 0 0 ${position}%)` }}
      >
        <img src={afterUgcImg} alt="Hasil UGC" className="h-full w-full object-cover" />
      </div>

      {/* Divider + handle */}
      <div className="absolute bottom-0 top-0 z-10" style={{ left: `${position}%`, transform: "translateX(-50%)" }}>
        <div className="h-full w-[2px] bg-primary/80 shadow-[0_0_8px_hsl(var(--primary)/0.3)]" />
        <div
          className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full border-2 border-primary-foreground/20 bg-primary shadow-lg"
          onMouseDown={() => setIsDragging(true)}
          onTouchStart={() => setIsDragging(true)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary-foreground">
            <path d="M8 3l-5 9 5 9" /><path d="M16 3l5 9-5 9" />
          </svg>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute bottom-3 left-3 z-20">
        <span className="rounded-md bg-background/60 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground backdrop-blur-sm">Produk</span>
      </div>
      <div className="absolute bottom-3 right-3 z-20">
        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary backdrop-blur-sm">UGC</span>
      </div>
    </div>
  );
}

/* ── Feature 03: Animated Video Preview ───────────── */

function AnimatedVideoPreview() {
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 0.5));
    }, 50);
    return () => clearInterval(timer);
  }, [isPlaying]);

  return (
    <div className="mx-auto w-full max-w-[320px] overflow-hidden rounded-2xl border border-border/60 bg-card/80">
      <div
        className="relative flex h-[200px] cursor-pointer items-center justify-center bg-secondary"
        onClick={() => setIsPlaying(!isPlaying)}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
        <motion.div
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/90 shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
          animate={{ scale: isPlaying ? [1, 1.08, 1] : 1 }}
          transition={{ repeat: isPlaying ? Infinity : 0, duration: 2 }}
        >
          {isPlaying ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-primary-foreground">
              <rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <div className="ml-1 h-0 w-0 border-y-[9px] border-l-[16px] border-y-transparent border-l-primary-foreground" />
          )}
        </motion.div>
        <span className="absolute right-3 top-3 rounded-lg bg-primary/20 px-2.5 py-1 text-[10px] font-semibold text-primary backdrop-blur-sm">Siap Reels</span>
      </div>
      <div className="px-4 pb-2 pt-3">
        <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
          <motion.div className="h-full rounded-full bg-primary" animate={{ width: `${progress}%` }} transition={{ duration: 0.05, ease: "linear" }} />
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="font-mono text-[10px] text-muted-foreground/50">00:{String(Math.floor((progress / 100) * 15)).padStart(2, "0")}</span>
          <span className="font-mono text-[10px] text-muted-foreground/50">00:15</span>
        </div>
      </div>
    </div>
  );
}

/* ── Feature 04: Animated Prompt Chat ─────────────── */

const fullPrompt = "Professional UGC photo of Indonesian woman wearing modern pastel hijab, holding glass serum bottle, natural lighting, shot on iPhone...";

function AnimatedPromptChat() {
  const [typed, setTyped] = useState(0);
  const [showResponse, setShowResponse] = useState(false);

  useEffect(() => {
    const cycle = () => {
      setTyped(0);
      setShowResponse(false);
      setTimeout(() => setShowResponse(true), 1000);
    };
    cycle();
    const interval = setInterval(cycle, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!showResponse || typed >= fullPrompt.length) return;
    const timer = setTimeout(() => setTyped((p) => p + 1), 25);
    return () => clearTimeout(timer);
  }, [typed, showResponse]);

  return (
    <div className="mx-auto w-full max-w-[320px] rounded-2xl border border-border/60 bg-card/80 p-5">
      <div className="mb-3 flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-secondary px-4 py-2.5">
          <p className="text-[13px] text-foreground">Serum wajah, botol kaca, di meja kayu</p>
        </div>
      </div>

      {showResponse && (
        <div className="flex justify-start">
          <div className="max-w-[90%] rounded-2xl rounded-bl-sm border border-border/40 bg-card px-4 py-2.5">
            <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
              {fullPrompt.slice(0, typed)}
              {typed < fullPrompt.length && (
                <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse rounded-sm bg-primary" />
              )}
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/40 bg-secondary/50 px-3.5 py-2.5">
        <span className="flex-1 text-[12px] text-muted-foreground/40">Deskripsikan produk...</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
          <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
        </svg>
      </div>
    </div>
  );
}

/* ── Feature Row Data ───────────────────────────────── */

const features = [
  {
    num: "01",
    title: "Pilih Karakter Sesuai Target Market",
    desc: "Karakter berbeda untuk setiap niche audience kamu.",
    visual: <CharacterShowcaseStack />,
    reversed: false,
  },
  {
    num: "02",
    title: "Generate Gambar UGC yang Convert",
    desc: "Upload foto produk, pilih karakter dan pose. AI langsung generate gambar UGC yang kelihatan kayak difoto beneran pakai iPhone.",
    visual: <BeforeAfterReveal />,
    reversed: true,
  },
  {
    num: "03",
    title: "Jadikan Video Siap Posting",
    desc: "Ubah gambar UGC jadi video 5-15 detik. Langsung bisa upload ke TikTok dan Instagram Reels.",
    visual: <AnimatedVideoPreview />,
    reversed: false,
  },
  {
    num: "04",
    title: "AI yang Ngerti Produk Kamu",
    desc: "Cukup deskripsikan produk pakai Bahasa Indonesia, AI otomatis bikin prompt terbaik. Gak perlu ribet belajar prompt engineering.",
    visual: <AnimatedPromptChat />,
    reversed: true,
  },
];

/* ── Feature Row Component ──────────────────────────── */

const FeatureRow = ({
  num, title, desc, visual, reversed, isVisible, delay,
}: {
  num: string; title: string; desc: string; visual: React.ReactNode; reversed: boolean; isVisible: boolean; delay: number;
}) => (
  <div
    className={`flex flex-col items-center gap-10 lg:gap-20 ${reversed ? "lg:flex-row-reverse" : "lg:flex-row"} ${isVisible ? "animate-fade-up" : "opacity-0"}`}
    style={{ animationDelay: `${delay}s` }}
  >
    <div className="flex-1">
      <span className="font-mono text-[48px] font-bold leading-none text-primary">{num}</span>
      <h3 className="mt-3 font-satoshi text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h3>
      <p className="mt-3 max-w-md font-body text-base text-muted-foreground">{desc}</p>
    </div>
    <div className="w-full max-w-sm flex-1">{visual}</div>
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

        <div className="mt-14 space-y-14 sm:space-y-20">
          {features.map((f, i) => (
            <FeatureRow key={f.num} {...f} isVisible={isVisible} delay={0.3 + i * 0.15} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FiturSection;
