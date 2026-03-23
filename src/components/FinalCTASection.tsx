import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const FinalCTASection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="relative py-20 sm:py-32 overflow-hidden">
      {/* Abstract orb background */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.06]"
        style={{
          background: "radial-gradient(circle, hsl(var(--cream)) 0%, hsl(160 50% 40%) 40%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <div ref={ref} className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          {/* Left — large headline */}
          <div className="max-w-xl">
            <h2
              className={`font-serif text-[32px] sm:text-[44px] lg:text-[56px] leading-[1.05] tracking-tight text-cream ${isVisible ? "animate-fade-up" : "opacity-0"}`}
              style={{ animationDelay: "0.1s" }}
            >
              Siap Bikin Konten UGC yang Bikin Cuan?
            </h2>

            <p
              className={`mt-5 max-w-[480px] text-base sm:text-lg text-muted-foreground ${isVisible ? "animate-fade-up" : "opacity-0"}`}
              style={{ animationDelay: "0.2s" }}
            >
              Sekali bayar, akses selamanya. Gabung bareng ribuan affiliate marketer Indonesia yang udah pakai GENBOX.
            </p>
          </div>

          {/* Right — CTA */}
          <div
            className={`lg:pb-3 ${isVisible ? "animate-fade-up" : "opacity-0"}`}
            style={{ animationDelay: "0.3s" }}
          >
            <Link
              to="/checkout"
              className="inline-flex items-center gap-2 rounded-full bg-cream px-10 py-4 text-sm font-bold tracking-wider text-cream-foreground transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-8px_hsl(var(--cream)/0.3)]"
            >
              Beli Sekarang — Rp 149.000
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-4 text-xs text-muted-foreground">
              Lifetime access · Setup 2 menit · Akses selamanya
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTASection;
