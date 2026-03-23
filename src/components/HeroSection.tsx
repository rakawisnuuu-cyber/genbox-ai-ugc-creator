import { useEffect, useRef, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { Zap, Infinity, CreditCard, Star, Sparkles } from "lucide-react";
import MarqueeStrip from "@/components/MarqueeStrip";

const DepthDeckCarousel = lazy(() => import("@/components/DepthDeckCarousel"));

const marqueeItems = [
  { icon: Zap, label: "Setup 2 Menit" },
  { icon: Infinity, label: "Akses Selamanya" },
  { icon: CreditCard, label: "Tanpa Langganan" },
  { icon: Star, label: "10+ Karakter Preset" },
  { icon: Sparkles, label: "AI-Powered UGC" },
  { icon: Zap, label: "Output HD Realistis" },
];

const HeroSection = () => {
  const orbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rafId: number;
    const onScroll = () => {
      rafId = requestAnimationFrame(() => {
        if (orbRef.current) {
          orbRef.current.style.transform = `translate(-50%, -50%) translateY(${window.scrollY * 0.2}px)`;
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
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, hsl(220 10% 5%) 0%, hsl(220 10% 3.5%) 100%)",
        }}
      />

      {/* Floating orb with parallax */}
      <div
        ref={orbRef}
        className="hero-orb pointer-events-none"
        style={{ top: "40%", left: "50%", transform: "translate(-50%, -50%)" }}
      />

      {/* Carousel — ambient behind content */}
      <div className="relative z-[1] flex-1 flex items-center justify-center pt-24 pb-8">
        <Suspense
          fallback={
            <div className="h-[340px] flex items-center justify-center">
              <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <div className="opacity-60">
            <DepthDeckCarousel autoPlayInterval={3500} />
          </div>
        </Suspense>
      </div>

      {/* Bottom content — split layout */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 pb-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            {/* Left — headline */}
            <div className="animate-fade-up max-w-2xl" style={{ animationDelay: "0.2s" }}>
              <h1 className="font-serif text-[40px] sm:text-[56px] lg:text-[72px] leading-[0.95] tracking-tight text-cream">
                Konten UGC
                <br />
                yang Converts
              </h1>
              <p className="mt-4 max-w-md font-body text-base text-muted-foreground sm:text-lg leading-relaxed">
                Generate foto & video UGC realistis untuk TikTok Shop, Shopee, dan Instagram.{" "}
                <span className="text-foreground/60">Tanpa model, tanpa studio.</span>
              </p>
            </div>

            {/* Right — CTA pill */}
            <div className="animate-fade-up lg:pb-3" style={{ animationDelay: "0.4s" }}>
              <Link
                to="/login"
                className="group inline-flex h-14 items-center gap-3 rounded-full bg-cream px-10 text-sm font-bold tracking-wider text-cream-foreground transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-8px_hsl(var(--cream)/0.3)]"
              >
                Mulai Generate
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Marquee strip */}
        <div className="mt-10 border-t border-border/30 pt-5">
          <MarqueeStrip speed={35}>
            {marqueeItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-[12px] text-muted-foreground/60 whitespace-nowrap">
                <item.icon className="h-3.5 w-3.5 text-primary/40" />
                <span>{item.label}</span>
                <span className="ml-6 text-border/40">•</span>
              </div>
            ))}
          </MarqueeStrip>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
