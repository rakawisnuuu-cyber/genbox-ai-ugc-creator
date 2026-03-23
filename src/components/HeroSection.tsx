import { useEffect, useRef, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { Zap, Infinity, CreditCard } from "lucide-react";

const DepthDeckCarousel = lazy(() => import("@/components/DepthDeckCarousel"));

const trustPills = [
  { icon: Zap, label: "Setup 2 Menit" },
  { icon: Infinity, label: "Akses Selamanya" },
  { icon: CreditCard, label: "Tanpa Langganan" },
];

const HeroSection = () => {
  const scrollRef = useRef(0);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rafId: number;
    const onScroll = () => {
      scrollRef.current = window.scrollY;
      rafId = requestAnimationFrame(() => {
        if (gridRef.current) {
          gridRef.current.style.transform = `translateY(${scrollRef.current * 0.15}px)`;
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16">
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, hsl(220 10% 5%) 0%, hsl(220 10% 3.5%) 100%)",
        }}
      />

      {/* Grid pattern with parallax */}
      <div ref={gridRef} className="absolute inset-0 grid-pattern" />

      {/* Ambient glow behind headline */}
      <div
        className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[600px] rounded-full opacity-[0.06]"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-4 text-center">
        {/* Badge */}

        {/* Headline */}
        <h1
          className="animate-fade-up mt-8 max-w-[820px] font-satoshi text-[32px] font-bold leading-[1.08] tracking-tight sm:text-[44px] lg:text-[58px]"
          style={{
            animationDelay: "0.2s",
            background: "linear-gradient(180deg, hsl(60 10% 98%) 0%, hsl(220 5% 50%) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Konten UGC yang Converts
          <br />
          <span
            style={{
              background: "linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(75 70% 65%) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Tanpa Model, Tanpa Studio
          </span>
        </h1>

        {/* Subheadline */}
        <p
          className="animate-fade-up mt-6 max-w-[560px] font-body text-[15px] leading-relaxed text-muted-foreground sm:text-lg"
          style={{ animationDelay: "0.3s" }}
        >
          Generate foto & video UGC realistis untuk TikTok Shop, Shopee, dan Instagram.
          <span className="text-foreground/70"> Powered by AI, siap posting dalam 30 detik.</span>
        </p>

        {/* Single CTA */}
        <div className="animate-fade-up mt-10" style={{ animationDelay: "0.4s" }}>
          <Link
            to="/login"
            className="group inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-8 text-sm font-bold tracking-wider text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-8px_hsl(var(--primary)/0.5)] hover:bg-[hsl(var(--lime-hover))]"
          >
            Mulai Generate
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </div>

        {/* Trust pills */}
        <div className="animate-fade-up mt-8 flex flex-wrap justify-center gap-3 lg:gap-8" style={{ animationDelay: "0.5s" }}>
          {trustPills.map((pill) => (
            <div
              key={pill.label}
              className="flex items-center gap-1.5 rounded-full border border-border/40 bg-card/50 px-3 py-1.5 text-[11px] text-muted-foreground backdrop-blur-sm"
            >
              <pill.icon className="h-3 w-3 text-primary/60" />
              {pill.label}
            </div>
          ))}
        </div>
      </div>

      {/* Showcase section */}
      <div
        className="animate-fade-up relative z-10 mt-16 w-full max-w-4xl mx-auto pb-12"
        style={{ animationDelay: "0.6s" }}
      >
        <p className="mb-6 text-center text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/40">
          Hasil generate dari GENBOX
        </p>
        <Suspense
          fallback={
            <div className="h-[340px] flex items-center justify-center">
              <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <DepthDeckCarousel autoPlayInterval={3500} />
        </Suspense>
      </div>
    </section>
  );
};

export default HeroSection;
