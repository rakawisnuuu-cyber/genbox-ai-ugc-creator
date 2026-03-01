import { ShoppingCart, Smartphone, Store } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const cards = [
  {
    icon: ShoppingCart,
    title: "Seller TikTok Shop & Shopee",
    desc: "Generate foto produk UGC berkualitas tanpa ribet hire model atau fotografer",
  },
  {
    icon: Smartphone,
    title: "Affiliate Marketer",
    desc: "Bikin konten review produk yang kelihatan real dalam hitungan detik",
  },
  {
    icon: Store,
    title: "UMKM & Brand Lokal",
    desc: "Konten berkualitas studio tapi dengan budget UMKM — hemat dan cuan",
  },
];

const DibuatUntukSection = () => {
  const { ref, isVisible } = useScrollReveal(0.15);

  return (
    <section ref={ref} className="relative z-10 px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-10 sm:mb-14">
          <h2
            className={`font-satoshi text-2xl sm:text-3xl lg:text-[40px] font-bold uppercase tracking-tight mb-3 ${isVisible ? "animate-fade-up" : "opacity-0"}`}
            style={{
              animationDelay: "0.1s",
              background: "linear-gradient(180deg, hsl(0 0% 100%) 0%, hsl(0 0% 63%) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            DIBUAT UNTUK AFFILIATE MARKETER INDONESIA
          </h2>
          <p
            className={`font-body text-base sm:text-lg text-muted-foreground max-w-[520px] mx-auto ${isVisible ? "animate-fade-up" : "opacity-0"}`}
            style={{ animationDelay: "0.2s" }}
          >
            Dari seller TikTok Shop sampai dropshipper — GENBOX bantu kamu bikin konten yang convert.
          </p>
        </div>

        <div className="grid gap-8 sm:gap-12 md:grid-cols-3">
          {cards.map((card, i) => (
            <div
              key={card.title}
              className={`rounded-xl border border-border bg-card p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:border-primary/40 ${isVisible ? "animate-fade-up" : "opacity-0"}`}
              style={{ animationDelay: `${0.3 + i * 0.1}s` }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                <card.icon size={20} className="text-primary" />
              </div>
              <h3 className="mt-4 font-satoshi text-lg font-bold text-foreground">
                {card.title}
              </h3>
              <p className="mt-2 font-body text-sm text-muted-foreground">
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DibuatUntukSection;
