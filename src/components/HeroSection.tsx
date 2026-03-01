import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

const particles = [
  { size: 5, top: "18%", left: "12%", delay: "0s" },
  { size: 7, top: "25%", left: "85%", delay: "-1.2s" },
  { size: 4, top: "70%", left: "8%", delay: "-2.5s" },
  { size: 6, top: "65%", left: "90%", delay: "-3.8s" },
];

const marqueeGradients = [
  "from-purple-600 to-pink-500",
  "from-blue-500 to-cyan-400",
  "from-orange-500 to-yellow-400",
  "from-green-500 to-emerald-400",
  "from-rose-500 to-red-400",
  "from-purple-600 to-pink-500",
  "from-blue-500 to-cyan-400",
  "from-orange-500 to-yellow-400",
  "from-green-500 to-emerald-400",
  "from-rose-500 to-red-400",
];

const HeroSection = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16">
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, hsl(0 0% 4%) 0%, hsl(0 0% 2%) 100%)",
        }}
      />

      {/* Grid pattern with parallax */}
      <div
        className="absolute inset-0 grid-pattern"
        style={{ transform: `translateY(${scrollY * 0.15}px)` }}
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
        {/* Badge */}
        <div
          className="animate-fade-up flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-primary-foreground"
          style={{ animationDelay: "0.1s" }}
        >
          <Sparkles size={14} />
          AI-POWERED UGC GENERATOR
        </div>

        {/* Headline */}
        <h1
          className="animate-fade-up mt-8 max-w-[800px] font-satoshi text-[32px] font-bold uppercase leading-[1.1] tracking-[0.05em] sm:text-[44px] lg:text-[56px]"
          style={{
            animationDelay: "0.2s",
            background: "linear-gradient(180deg, hsl(0 0% 100%) 0%, hsl(0 0% 63%) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          BIKIN KONTEN UGC REALISTIS DALAM 30 DETIK
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
          <a
            href="#harga"
            className="flex h-12 items-center rounded-lg bg-primary px-6 text-sm font-bold uppercase tracking-wider text-primary-foreground transition-all hover:-translate-y-px hover:bg-[hsl(var(--lime-hover))]"
          >
            BELI SEKARANG — Rp 249.000 →
          </a>
          <button className="flex h-12 items-center rounded-lg border border-foreground/20 bg-transparent px-6 text-sm font-bold uppercase tracking-wider text-foreground transition-colors hover:bg-foreground/5">
            LIHAT DEMO ▶
          </button>
        </div>

        {/* Trust text */}
        <p
          className="animate-fade-up mt-6 text-xs text-[hsl(var(--text-muted))]"
          style={{ animationDelay: "0.5s" }}
        >
          Lifetime access • Setup 2 menit • Tanpa langganan
        </p>
      </div>

      {/* Marquee */}
      <div
        className="animate-fade-up relative z-10 mt-16 w-full overflow-hidden pb-12"
        style={{ animationDelay: "0.6s" }}
      >
        <div className="animate-marquee flex gap-4">
          {[...marqueeGradients, ...marqueeGradients].map((g, i) => (
            <div
              key={i}
              className={`h-[280px] w-[200px] flex-shrink-0 rounded-xl bg-gradient-to-br ${g} opacity-80`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
