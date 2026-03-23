import { Check, ArrowRight, Gift, Lock, Zap, Infinity } from "lucide-react";
import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const features = [
  "Generate gambar unlimited",
  "Generate video unlimited",
  "Output tanpa watermark",
  "Setup guide lengkap",
  "Update fitur selamanya",
  "WhatsApp support group",
];

const trustItems = [
  { icon: Lock, label: "Pembayaran Aman" },
  { icon: Zap, label: "Akses Instant" },
  { icon: Infinity, label: "Lifetime Updates" },
];

const HargaSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section id="harga" className="relative py-20 sm:py-32 overflow-hidden">
      <div ref={ref} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Left-aligned header */}
        <div className="max-w-2xl">
          <span
            className={`inline-block rounded-full border border-cream/15 bg-cream/5 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-cream/70 ${isVisible ? "animate-fade-up" : "opacity-0"}`}
            style={{ animationDelay: "0.1s" }}
          >
            Harga
          </span>

          <h2
            className={`mt-6 font-serif text-[32px] sm:text-[44px] lg:text-[52px] leading-[1.05] tracking-tight text-cream ${isVisible ? "animate-fade-up" : "opacity-0"}`}
            style={{ animationDelay: "0.2s" }}
          >
            Satu Kali Bayar.
            <br />
            Selamanya Milikmu.
          </h2>
          <p
            className={`mt-4 text-base text-muted-foreground sm:text-lg ${isVisible ? "animate-fade-up" : "opacity-0"}`}
            style={{ animationDelay: "0.3s" }}
          >
            Tanpa langganan bulanan. Tanpa biaya tersembunyi.
          </p>
        </div>

        {/* Pricing Card */}
        <div
          className={`mx-auto mt-14 max-w-md ${isVisible ? "animate-fade-up" : "opacity-0"}`}
          style={{ animationDelay: "0.4s" }}
        >
          <div className="mb-4 flex justify-center">
            <span className="animate-shimmer rounded-full bg-clip-text px-5 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-transparent">
              PALING WORTH IT
            </span>
          </div>

          <div className="rounded-3xl border-2 border-cream/30 bg-card/60 p-8 shadow-[0_0_48px_-12px_hsl(var(--cream)/0.08)] transition-shadow duration-300 hover:shadow-[0_0_60px_-8px_hsl(var(--cream)/0.15)]">
            <p className="font-satoshi text-lg font-bold tracking-tight text-foreground">GENBOX Lifetime</p>

            <p className="mt-4 text-lg text-muted-foreground/60 line-through font-satoshi font-medium">Rp 249.000</p>
            <p className="font-serif text-[44px] sm:text-[56px] font-bold leading-none text-cream">Rp 129.000</p>
            <p className="mt-2 text-sm font-bold text-cream/70">sekali bayar · akses selamanya</p>

            <ul className="mt-8 space-y-3">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cream/10">
                    <Check className="h-3 w-3 text-cream" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex items-start gap-3 rounded-xl border border-border/60 bg-secondary/50 p-4">
              <Gift className="mt-0.5 h-5 w-5 shrink-0 text-cream" />
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">BONUS:</span> n8n Automation Blueprint{" "}
                <span className="text-muted-foreground">(worth Rp 500.000)</span>
              </p>
            </div>

            <Link
              to="/checkout"
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-cream py-4 text-sm font-bold tracking-wider text-cream-foreground transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-6px_hsl(var(--cream)/0.3)]"
            >
              Beli Sekarang
              <ArrowRight className="h-4 w-4" />
            </Link>

            <p className="mt-4 text-center text-[11px] text-muted-foreground">QRIS · GoPay · Virtual Account</p>

            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
              <Zap className="h-3 w-3 text-cream/60" />
              Biaya API kamu sendiri: cuma ~Rp 150-500/gambar
            </div>
          </div>
        </div>

        {/* Trust row */}
        <div
          className={`mt-12 flex flex-wrap items-center justify-center gap-8 ${isVisible ? "animate-fade-up" : "opacity-0"}`}
          style={{ animationDelay: "0.5s" }}
        >
          {trustItems.map((t) => (
            <div key={t.label} className="flex items-center gap-2 text-sm text-muted-foreground">
              <t.icon className="h-4 w-4 text-cream/60" />
              {t.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HargaSection;
