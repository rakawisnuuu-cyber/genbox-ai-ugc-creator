import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { PRICING } from "@/lib/pricing";
import BYOKDisclaimerModal from "@/components/BYOKDisclaimerModal";

const FinalCTASection = () => {
  const { ref, isVisible } = useScrollReveal();
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  return (
    <section className="relative py-16 sm:py-24 overflow-hidden">
      {/* Radial gradient bg */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, hsla(75,85%,52%,0.04) 0%, transparent 70%)",
        }}
      />

      {/* Decorative glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.03]"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
        }}
      />

      <div ref={ref} className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2
          className={`font-satoshi text-2xl sm:text-3xl lg:text-[40px] font-bold leading-tight tracking-tight text-foreground ${isVisible ? "animate-fade-up" : "opacity-0"}`}
          style={{ animationDelay: "0.1s" }}
        >
          Siap Bikin Konten UGC yang Bikin Cuan?
        </h2>

        <p
          className={`mx-auto mt-5 max-w-[520px] text-base sm:text-lg text-muted-foreground ${isVisible ? "animate-fade-up" : "opacity-0"}`}
          style={{ animationDelay: "0.2s" }}
        >
          Sekali bayar, akses selamanya. Gabung bareng ribuan affiliate marketer Indonesia yang udah pakai GENBOX.
        </p>

        <div
          className={`mt-10 ${isVisible ? "animate-fade-up" : "opacity-0"}`}
          style={{ animationDelay: "0.3s" }}
        >
          <button onClick={() => setShowDisclaimer(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-sm font-bold tracking-wider text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-6px_hsl(var(--primary)/0.4)] animate-cta-glow">
            {PRICING.ctaText}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <p
          className={`mt-6 text-xs text-muted-foreground ${isVisible ? "animate-fade-up" : "opacity-0"}`}
          style={{ animationDelay: "0.4s" }}
        >
          Lifetime access · Setup 2 menit · Akses selamanya
        </p>
      </div>
    </section>
  );
};

export default FinalCTASection;
