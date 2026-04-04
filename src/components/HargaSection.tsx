import { useState } from "react";
import { Check, ArrowRight, Gift, Lock, Zap, Infinity, ShieldCheck } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { PRICING } from "@/lib/pricing";
import BYOKDisclaimerModal from "@/components/BYOKDisclaimerModal";

const features = [
  "Generate gambar unlimited",
  "Generate video unlimited",
  "Output tanpa watermark",
  "Setup guide lengkap",
  "Update fitur selamanya",
  "Custom GPT for advance prompting & scripting",
  "Telegram support group",
];

const trustItems = [
  { icon: Lock, label: "Pembayaran Aman" },
  { icon: Zap, label: "Akses Instant" },
  { icon: Infinity, label: "Lifetime Updates" },
];

const valueProps = [
  "Tanpa biaya model atau talent",
  "Tanpa langganan bulanan",
  "Biaya API kamu sendiri: ~Rp 150-500/gambar",
  "Update fitur selamanya tanpa bayar lagi",
];

const HargaSection = () => {
  const { ref, isVisible } = useScrollReveal();
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  return (
    <section id="harga" className="relative py-16 sm:py-24 overflow-hidden">
      <div ref={ref} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Badge */}
        <div
          className={`flex justify-center mb-6 ${isVisible ? "animate-fade-up" : "opacity-0"}`}
          style={{ animationDelay: "0.1s" }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-primary">
            Harga
          </span>
        </div>

        {/* Desktop: 2-column layout */}
        <div className={`mt-8 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start ${isVisible ? "animate-fade-up" : "opacity-0"}`} style={{ animationDelay: "0.2s" }}>
          {/* Left — Value Proposition */}
          <div className="flex flex-col justify-center lg:pt-8">
            <h2 className="font-satoshi text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
              Satu Kali Bayar.<br />
              <span className="text-primary">Selamanya Milikmu.</span>
            </h2>
            <p className="mt-4 text-base text-muted-foreground max-w-md">
              Tanpa langganan bulanan. Tanpa biaya tersembunyi. Akses semua fitur selamanya dengan satu pembayaran.
            </p>

            {/* Value props */}
            <ul className="mt-8 space-y-3">
              {valueProps.map((v) => (
                <li key={v} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Check className="h-3 w-3 text-primary" />
                  </span>
                  {v}
                </li>
              ))}
            </ul>

            {/* Trust row */}
            <div className="mt-10 flex flex-wrap items-center gap-6">
              {trustItems.map((t) => (
                <div key={t.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <t.icon className="h-4 w-4 text-primary" />
                  {t.label}
                </div>
              ))}
            </div>
          </div>

          {/* Right — Pricing Card */}
          <div>
            {/* Shimmer badge */}
            <div className="mb-4 flex justify-center">
              <span className="animate-shimmer rounded-full bg-clip-text px-5 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-transparent">
                PALING WORTH IT
              </span>
            </div>

            <div className="rounded-3xl border-2 border-primary/50 bg-card/80 p-8 shadow-[0_0_48px_-12px_hsl(var(--primary)/0.15)] transition-shadow duration-300 hover:shadow-[0_0_60px_-8px_hsl(var(--primary)/0.25)]">
              <p className="font-satoshi text-lg font-bold tracking-tight text-foreground">GENBOX Lifetime</p>

              <p className="mt-4 text-lg text-muted-foreground/60 line-through font-satoshi font-medium">{PRICING.originalPriceLabel}</p>
              <p className="font-satoshi text-[44px] sm:text-[56px] font-bold leading-none text-foreground">{PRICING.priceLabel}</p>
              <p className="mt-2 text-sm font-bold text-primary">sekali bayar · akses selamanya</p>

              {/* Features */}
              <ul className="mt-8 space-y-3">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Check className="h-3 w-3 text-primary" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* Bonus */}
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-border/60 bg-secondary/50 p-4">
                <Gift className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">BONUS:</span> n8n Automation Blueprint{" "}
                  <span className="text-muted-foreground">(worth Rp 500.000)</span>
                </p>
              </div>

              {/* CTA */}
              <button
                onClick={() => setShowDisclaimer(true)}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-sm font-bold tracking-wider text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-6px_hsl(var(--primary)/0.4)] animate-cta-glow"
              >
                Beli Sekarang
                <ArrowRight className="h-4 w-4" />
              </button>

              <p className="mt-4 text-center text-[11px] text-muted-foreground">QRIS · GoPay · Virtual Account</p>
            </div>
          </div>
        </div>
      </div>
      <BYOKDisclaimerModal open={showDisclaimer} onOpenChange={setShowDisclaimer} />
    </section>
  );
};

export default HargaSection;
