import { ArrowRight } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const FinalCTASection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="relative py-10 sm:py-14 overflow-hidden">
      {/* Radial gradient bg */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, hsla(73,100%,50%,0.04) 0%, transparent 70%)",
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
          className={`font-satoshi text-2xl sm:text-3xl lg:text-[40px] font-bold uppercase leading-tight tracking-wide text-foreground ${isVisible ? "animate-fade-up" : "opacity-0"}`}
          style={{ animationDelay: "0.1s" }}
        >
          SIAP BIKIN KONTEN UGC YANG BIKIN CUAN?
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
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-sm font-bold uppercase tracking-wider text-primary-foreground transition-all hover:brightness-110 hover:-translate-y-0.5 animate-cta-glow">
            GENERATE SEKARANG — Rp 249.000
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <p
          className={`mt-6 text-xs text-muted-foreground ${isVisible ? "animate-fade-up" : "opacity-0"}`}
          style={{ animationDelay: "0.4s" }}
        >
          Lifetime access • Setup 2 menit • Akses selamanya
        </p>
      </div>
    </section>
  );
};

export default FinalCTASection;
