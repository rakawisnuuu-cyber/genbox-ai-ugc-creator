import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const features = [
  "Akses dashboard selamanya",
  "Karakter AI konsisten",
  "Prompt generator otomatis",
  "Output untuk semua marketplace",
  "Update fitur gratis",
  "Panduan setup lengkap",
  "Komunitas & support",
  "Tanpa biaya bulanan",
];

const HargaSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section id="harga" ref={ref} className="py-24 relative">
      <div className="container mx-auto px-6 flex justify-center">
        <div
          className={`w-full max-w-lg p-8 md:p-10 rounded-2xl border border-primary/40 bg-card glow-lime transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="text-center mb-8">
            <span className="inline-block mb-4 px-4 py-1.5 rounded-full border border-primary/30 text-xs font-heading tracking-wider text-primary">
              LIFETIME ACCESS
            </span>
            <div className="font-mono text-5xl md:text-6xl font-bold text-foreground mb-2">
              Rp 249.000
            </div>
            <p className="text-muted-foreground text-sm">Sekali bayar, akses selamanya</p>
          </div>

          <div className="space-y-3 mb-8">
            {features.map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-primary" />
                </div>
                <span className="text-foreground text-sm">{f}</span>
              </div>
            ))}
          </div>

          <Button
            size="lg"
            className="w-full font-heading text-sm tracking-wider py-6 bg-primary text-primary-foreground hover:bg-primary/90 animate-glow-pulse rounded-xl"
          >
            BELI SEKARANG
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HargaSection;
