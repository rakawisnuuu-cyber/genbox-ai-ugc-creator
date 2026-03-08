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
    <section ref={ref} className="relative z-10 px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-5xl text-center">
        <h2
          className={`font-satoshi text-[28px] font-bold leading-tight tracking-tight sm:text-[36px] lg:text-[42px] ${isVisible ? "animate-fade-up" : "opacity-0"}`}
          style={{
            animationDelay: "0.1s",
            background: "linear-gradient(180deg, hsl(60 10% 98%) 0%, hsl(220 5% 56%) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Dibuat untuk Affiliate Marketer Indonesia
        </h2>
        <p
          className={`mx-auto mt-4 max-w-[600px] font-body text-base text-muted-foreground sm:text-lg ${isVisible ? "animate-fade-up" : "opacity-0"}`}
          style={{ animationDelay: "0.2s" }}
        >
          Dari seller TikTok Shop sampai dropshipper — GENBOX bantu kamu bikin konten yang convert.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {cards.map((card, i) => (
            <div
              key={card.title}
              className={`rounded-2xl border border-border/60 bg-card/80 p-6 text-left card-hover ${isVisible ? "animate-fade-up" : "opacity-0"}`}
              style={{ animationDelay: `${0.3 + i * 0.1}s` }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
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
