import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import GenboxLogo from "./GenboxLogo";

const FooterSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <>
      {/* PART 1 — Closing CTA */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, hsla(75,85%,52%,0.03) 0%, transparent 70%)",
          }}
        />
        <div ref={ref} className="relative mx-auto max-w-2xl px-4 text-center">
          <h2
            className={`font-satoshi text-2xl sm:text-3xl lg:text-[40px] font-bold leading-tight ${isVisible ? "animate-fade-up" : "opacity-0"}`}
            style={{ animationDelay: "0.1s" }}
          >
            <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Siap Scale Konten UGC Kamu?
            </span>
          </h2>
          <p
            className={`mt-4 text-base text-muted-foreground ${isVisible ? "animate-fade-up" : "opacity-0"}`}
            style={{ animationDelay: "0.2s" }}
          >
            Join early access — setup dalam 2 menit, generate tanpa batas.
          </p>
          <div
            className={`mt-8 ${isVisible ? "animate-fade-up" : "opacity-0"}`}
            style={{ animationDelay: "0.3s" }}
          >
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-[0_0_20px_hsla(75,85%,52%,0.15)] transition-all duration-300 hover:shadow-[0_0_30px_hsla(75,85%,52%,0.25)] hover:scale-[1.02] animate-cta-glow"
            >
              Get Started →
            </Link>
          </div>
          <p
            className={`mt-4 text-xs text-muted-foreground ${isVisible ? "animate-fade-up" : "opacity-0"}`}
            style={{ animationDelay: "0.4s" }}
          >
            Invite code required · Lifetime access
          </p>
        </div>
      </section>

      {/* Divider */}
      <div className="mx-auto max-w-5xl px-4">
        <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
      </div>

      {/* PART 2 — Footer */}
      <footer className="py-8 px-4">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <GenboxLogo size={22} variant="icon" />
            <span className="text-xs text-muted-foreground/50">© 2025 GENBOX</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-muted-foreground/50 hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="text-xs text-muted-foreground/50 hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="text-xs text-muted-foreground/50 hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </>
  );
};

export default FooterSection;
