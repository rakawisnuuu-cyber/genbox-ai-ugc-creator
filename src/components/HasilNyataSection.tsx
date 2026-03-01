import { Sparkles, Package, ShoppingBag, UtensilsCrossed, Zap, User } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { useRef, useState, useEffect } from "react";

const cards = [
  { label: "Skincare", icon: Package, gradient: "to-purple-900/30" },
  { label: "Fashion", icon: ShoppingBag, gradient: "to-indigo-900/30" },
  { label: "Makanan", icon: UtensilsCrossed, gradient: "to-rose-900/30" },
];

const ComparisonCard = ({
  label,
  icon: Icon,
  gradient,
  isVisible,
  delay,
}: {
  label: string;
  icon: typeof Package;
  gradient: string;
  isVisible: boolean;
  delay: number;
}) => (
  <div
    className={`snap-center rounded-xl border border-border bg-card transition-all duration-300 hover:scale-[1.02] hover:border-primary/40 hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.15)] ${isVisible ? "animate-fade-up" : "opacity-0"}`}
    style={{ animationDelay: `${delay}s` }}
  >
    <div className="relative flex h-[200px] overflow-hidden rounded-t-xl">
      {/* Before */}
      <div className={`flex flex-1 flex-col items-center justify-center bg-gradient-to-br from-card ${gradient}`}>
        <span className="mb-3 rounded-full bg-orange-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-orange-400">
          Sebelum
        </span>
        <Icon size={36} className="text-muted-foreground" />
      </div>

      {/* Divider with Zap */}
      <div className="absolute inset-y-0 left-1/2 flex -translate-x-1/2 items-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card animate-pulse-subtle">
          <Zap size={14} className="text-primary" />
        </div>
      </div>

      {/* After */}
      <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-bl from-card to-primary/5">
        <span className="mb-3 rounded-full bg-primary/20 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
          Sesudah
        </span>
        <div className="relative">
          <User size={36} className="text-foreground" />
          <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-card">
            <Icon size={10} className="text-primary" />
          </div>
        </div>
      </div>
    </div>

    {/* Label */}
    <div className="border-t border-border px-4 py-3">
      <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  </div>
);

const HasilNyataSection = () => {
  const { ref, isVisible } = useScrollReveal(0.15);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const index = Math.round(el.scrollLeft / el.offsetWidth);
      setActiveIndex(index);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section ref={ref} className="relative z-10 px-4 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        {/* Badge */}
        <div className="flex justify-center">
          <div
            className={`flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-primary-foreground ${isVisible ? "animate-fade-up" : "opacity-0"}`}
            style={{ animationDelay: "0.1s" }}
          >
            <Sparkles size={14} />
            HASIL NYATA
          </div>
        </div>

        {/* Heading */}
        <h2
          className={`mx-auto mt-6 max-w-[700px] text-center font-satoshi text-[28px] font-bold uppercase leading-tight tracking-[0.04em] sm:text-[36px] lg:text-[42px] ${isVisible ? "animate-fade-up" : "opacity-0"}`}
          style={{
            animationDelay: "0.2s",
            background: "linear-gradient(180deg, hsl(0 0% 100%) 0%, hsl(0 0% 63%) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          DARI FOTO PRODUK BIASA KE KONTEN UGC PREMIUM
        </h2>

        {/* Desktop grid */}
        <div className="mt-12 hidden gap-6 md:grid md:grid-cols-3">
          {cards.map((card, i) => (
            <ComparisonCard key={card.label} {...card} isVisible={isVisible} delay={0.3 + i * 0.12} />
          ))}
        </div>

        {/* Mobile snap scroll */}
        <div className="mt-12 md:hidden">
          <div
            ref={scrollRef}
            className="scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4"
          >
            {cards.map((card, i) => (
              <div key={card.label} className="w-[85vw] flex-shrink-0 snap-center">
                <ComparisonCard {...card} isVisible={isVisible} delay={0.3 + i * 0.12} />
              </div>
            ))}
          </div>
          {/* Dots */}
          <div className="mt-4 flex justify-center gap-2">
            {cards.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIndex ? "w-6 bg-primary" : "w-1.5 bg-border"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HasilNyataSection;
