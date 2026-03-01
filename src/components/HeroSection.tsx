import { Button } from "@/components/ui/button";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const HeroSection = () => {
  const { ref, isVisible } = useScrollReveal(0.1);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center bg-grid overflow-hidden pt-16">
      <div className="container mx-auto px-6 text-center relative z-10">
        <div
          className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-border text-xs font-heading tracking-wider text-muted-foreground">
            AI-POWERED UGC GENERATOR
          </div>

          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight mb-6 max-w-4xl mx-auto">
            <span className="text-foreground">Bikin Konten UGC Realistis.</span>
            <br />
            <span className="text-primary">Tanpa Model, Tanpa Studio.</span>
          </h1>

          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Platform AI untuk seller e-commerce Indonesia. Generate foto UGC berkualitas tinggi
            untuk produkmu — lebih cepat, lebih murah, lebih konsisten.
          </p>

          <Button
            size="lg"
            className="font-heading text-sm tracking-wider px-8 py-6 bg-primary text-primary-foreground hover:bg-primary/90 animate-glow-pulse rounded-xl"
          >
            BELI SEKARANG — Rp 249.000
          </Button>

          <p className="text-muted-foreground text-sm mt-4">
            Sekali bayar. Akses selamanya.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
