import { Users, Wand2, Image, Wallet, Key, ShoppingBag } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const features = [
  { icon: Users, title: "Karakter AI Konsisten", desc: "Buat karakter virtual yang konsisten di setiap foto. Wajah, gaya, dan ekspresi tetap sama." },
  { icon: Wand2, title: "Prompt Generator Otomatis", desc: "Tidak perlu belajar prompting. Sistem otomatis generate prompt terbaik untuk produkmu." },
  { icon: Image, title: "UGC Hyper-Realistis", desc: "Hasil foto yang tidak bisa dibedakan dari foto asli. Kualitas studio, tanpa studio." },
  { icon: Wallet, title: "Hemat 90% Biaya", desc: "Tidak perlu sewa model, fotografer, atau studio. Hemat jutaan rupiah per campaign." },
  { icon: Key, title: "Pakai API Key Sendiri", desc: "Kontrol penuh atas biaya API. Bayar langsung ke provider, tanpa markup." },
  { icon: ShoppingBag, title: "Siap untuk Marketplace", desc: "Output dioptimalkan untuk Tokopedia, Shopee, TikTok Shop, dan marketplace lainnya." },
];

const FiturSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section id="fitur" ref={ref} className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <span className="inline-block mb-4 px-4 py-1.5 rounded-full border border-primary/30 text-xs font-heading tracking-wider text-primary">
            FITUR UNGGULAN
          </span>
          <h2 className="font-heading text-3xl md:text-4xl text-foreground">
            Semua yang Kamu Butuhkan
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`group p-6 rounded-xl border border-border bg-card hover:border-primary/40 hover:glow-lime-sm transition-all duration-500 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: isVisible ? `${i * 100}ms` : "0ms" }}
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <f.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-heading text-sm tracking-wider text-foreground mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FiturSection;
