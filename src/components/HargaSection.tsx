import { Check, ArrowRight, Gift, Lock, Zap, Infinity, Sparkles } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const features = [
  "Generate gambar unlimited",
  "Generate video unlimited",
  "10+ karakter + kustomisasi",
  "Output tanpa watermark",
  "AI Prompt Generator",
  "n8n automation blueprint",
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
    <section id="harga" className="relative py-10 sm:py-14 overflow-hidden">
      <div ref={ref} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Badge */}
        <div
          className={`flex justify-center mb-6 ${isVisible ? "animate-fade-up" : "opacity-0"}`}
          style={{ animationDelay: "0.1s" }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            HARGA
          </span>
        </div>

        {/* Heading */}
        <h2
          className={`text-center font-satoshi text-2xl sm:text-3xl lg:text-4xl font-bold uppercase tracking-wide text-foreground ${isVisible ? "animate-fade-up" : "opacity-0"}`}
          style={{ animationDelay: "0.2s" }}
        >
          SATU KALI BAYAR. SELAMANYA MILIKMU.
        </h2>
        <p
          className={`mt-4 text-center text-base text-muted-foreground ${isVisible ? "animate-fade-up" : "opacity-0"}`}
          style={{ animationDelay: "0.3s" }}
        >
          Tanpa langganan bulanan. Tanpa biaya tersembunyi.
        </p>

        {/* Pricing Card */}
        <div
          className={`mx-auto mt-14 max-w-md ${isVisible ? "animate-fade-up" : "opacity-0"}`}
          style={{ animationDelay: "0.4s" }}
        >
          {/* Shimmer badge */}
          <div className="mb-4 flex justify-center">
            <span className="animate-shimmer rounded-full bg-clip-text px-5 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-transparent">
              PALING WORTH IT
            </span>
          </div>

          <div className="rounded-2xl border-2 border-primary bg-card p-8 shadow-[0_0_30px_rgba(191,255,0,0.15)] transition-shadow duration-300 hover:shadow-[0_0_50px_rgba(191,255,0,0.25)] scale-[1.02]">
            <p className="font-satoshi text-lg font-bold uppercase tracking-wider text-foreground">
              BYOK LIFETIME
            </p>

            <p className="mt-4 font-satoshi text-[44px] sm:text-[56px] font-bold leading-none text-foreground">
              Rp 249.000
            </p>
            <p className="mt-2 text-sm font-bold text-primary">
              sekali bayar • akses selamanya
            </p>

            {/* Features */}
            <ul className="mt-8 space-y-3">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                  {f}
                </li>
              ))}
            </ul>

            {/* Bonus */}
            <div className="mt-6 flex items-start gap-3 rounded-lg border border-border bg-secondary p-4">
              <Gift className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">BONUS:</span> n8n Automation Blueprint{" "}
                <span className="text-muted-foreground">(worth Rp 500.000)</span>
              </p>
            </div>

            {/* CTA */}
            <button className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-4 text-sm font-bold uppercase tracking-wider text-primary-foreground transition-all hover:brightness-110 hover:-translate-y-0.5 animate-cta-glow">
              BELI SEKARANG
              <ArrowRight className="h-4 w-4" />
            </button>

            <p className="mt-4 text-center text-[11px] text-muted-foreground">
              QRIS • GoPay • ShopeePay • Virtual Account • Kartu Kredit
            </p>

            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
              <Zap className="h-3 w-3 text-primary" />
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
              <t.icon className="h-4 w-4 text-primary" />
              {t.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HargaSection;
