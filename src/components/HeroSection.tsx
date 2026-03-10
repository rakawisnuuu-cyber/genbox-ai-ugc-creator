import { useEffect, useRef, lazy, Suspense } from "react";
import { Link } from "react-router-dom";

const DepthDeckCarousel = lazy(() => import("@/components/DepthDeckCarousel"));

const particles = [
  { size: 5, top: "18%", left: "12%", delay: "0s" },
  { size: 7, top: "25%", left: "85%", delay: "-1.2s" },
  { size: 4, top: "70%", left: "8%", delay: "-2.5s" },
  { size: 6, top: "65%", left: "90%", delay: "-3.8s" },
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
      <div
        className="absolute inset-0 grid-pattern"
        style={{ transform: `translateY(${scrollY * 0.15}px)` }}
      />

      {/* Ambient glow behind headline */}
      <div
        className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[600px] rounded-full opacity-[0.06]"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
        }}
      />

      {/* Particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          className="hero-particle absolute rounded-full bg-primary"
          style={{
            width: p.size,
            height: p.size,
            top: p.top,
            left: p.left,
            animationDelay: p.delay,
          }}
        />
      ))}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-4 text-center">
        {/* Badge — outlined with pulsing dot */}
        <div
          className="animate-fade-up flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-primary"
          style={{ animationDelay: "0.1s" }}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          AI-Powered UGC Generator
        </div>

        {/* Headline */}
        <h1
          className="animate-fade-up mt-8 max-w-[800px] font-satoshi text-[32px] font-bold leading-[1.1] tracking-tight sm:text-[44px] lg:text-[56px]"
          style={{
            animationDelay: "0.2s",
            background: "linear-gradient(180deg, hsl(60 10% 98%) 0%, hsl(220 5% 56%) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Bikin Konten UGC Realistis dalam 30 Detik
        </h1>

        {/* Subheadline */}
        <p
          className="animate-fade-up mt-6 max-w-[600px] font-body text-base text-muted-foreground sm:text-lg"
          style={{ animationDelay: "0.3s" }}
        >
          Generate UGC konten berkualitas tinggi — tanpa model, tanpa studio.
        </p>

        {/* Buttons */}
        <div
          className="animate-fade-up mt-8 flex flex-col items-center gap-4 sm:flex-row"
          style={{ animationDelay: "0.4s" }}
        >
          <Link
            to="/login"
            className="flex h-12 items-center rounded-lg bg-primary px-6 text-sm font-bold tracking-wider text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-6px_hsl(var(--primary)/0.4)] hover:bg-[hsl(var(--lime-hover))]"
          >
            Cobain Sekarang <span className="ml-1.5">→</span>
          </Link>
          <button className="flex h-12 items-center gap-2 rounded-lg border border-foreground/20 bg-transparent px-6 text-sm font-bold tracking-wider text-foreground transition-colors hover:bg-foreground/5">
            Lihat Demo
          </button>
        </div>

        {/* Trust text */}
        <p
          className="animate-fade-up mt-6 text-xs text-[hsl(var(--text-muted))]"
          style={{ animationDelay: "0.5s" }}
        >
          Lifetime access · Setup 2 menit · Tanpa langganan
        </p>
      </div>

      {/* Showcase section */}
      <div
        className="animate-fade-up relative z-10 mt-16 w-full max-w-4xl mx-auto pb-12"
        style={{ animationDelay: "0.6s" }}
      >
        <p className="mb-6 text-center text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/40">
          Hasil generate dari GENBOX
        </p>
        <DepthDeckCarousel autoPlayInterval={3500} />
      </div>
    </section>
  );
};

export default HeroSection;
