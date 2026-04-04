import { Users, Sparkles, Film } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const PRESET_BASE = "https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/preset-characters";
const SHOWCASE_BASE = "https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/showcase-videos";

/* ── Feature Data ─────────────────────────────────── */

const features = [
  {
    num: "FITUR 01",
    icon: Users,
    title: "Karakter AI Siap Pakai",
    desc: "10+ preset karakter Indonesia — hijab, casual, profesional, Gen-Z. Atau buat custom karakter sendiri.",
    image: "/assets/images/fitur-01-karakter.png",
  },
  {
    num: "FITUR 02",
    icon: Sparkles,
    title: "Generate Gambar UGC Realistis",
    desc: "Upload foto produk, pilih karakter dan pose. AI generate gambar UGC yang kelihatan kayak difoto beneran — bukan gambar AI yang obvious.",
    image: "/assets/images/fitur-02-generate-v2.png",
  },
  {
    num: "FITUR 03",
    icon: Film,
    title: "Video Siap Posting",
    desc: "Jadikan gambar UGC jadi video 5-15 detik dengan audio sinkron. Langsung upload ke TikTok dan Instagram Reels.",
    image: `${SHOWCASE_BASE}/Fitur-03-image.png`,
  },
];

/* ── Module Card ──────────────────────────────────── */

const ModuleCard = ({
  num,
  icon: Icon,
  title,
  desc,
  image,
  isVisible,
  delay,
  isHero,
}: {
  num: string;
  icon: typeof Users;
  title: string;
  desc: string;
  image: string;
  isVisible: boolean;
  delay: number;
  isHero?: boolean;
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

    {/* Screenshot */}
    <div className="mt-6">
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
          src={image}
          alt={`Screenshot ${title}`}
          className="w-full"
          loading="lazy"
        />
      </div>
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

        {/* Feature 01 — full width hero */}
        <div className="mt-12">
          <ModuleCard {...features[0]} isVisible={isVisible} delay={0.3} isHero />
        </div>

        {/* Features 02 & 03 — side by side on desktop */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <ModuleCard {...features[1]} isVisible={isVisible} delay={0.45} />
          <ModuleCard {...features[2]} isVisible={isVisible} delay={0.6} />
        </div>
      </div>
    </section>
  );
};

export default FiturSection;
