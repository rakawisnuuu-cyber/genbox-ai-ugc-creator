import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const cards = [
  {
    num: "01",
    title: "Seller TikTok Shop & Shopee",
    desc: "Generate foto produk UGC berkualitas tanpa ribet hire model atau fotografer.",
  },
  {
    num: "02",
    title: "Affiliate Marketer",
    desc: "Bikin konten review produk yang kelihatan real dalam hitungan detik.",
  },
  {
    num: "03",
    title: "UMKM & Brand Lokal",
    desc: "Konten berkualitas studio tapi dengan budget UMKM — hemat dan cuan.",
  },
];

const DibuatUntukSection = () => {
  const { ref, isVisible } = useScrollReveal(0.15);

  return (
    <section ref={ref} className="relative z-10 px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-3xl lg:max-w-5xl">
        <h2
          className={`text-center font-satoshi text-[28px] font-bold leading-tight tracking-tight sm:text-[36px] lg:text-[42px] ${isVisible ? "animate-fade-up" : "opacity-0"}`}
          style={{
            animationDelay: "0.1s",
            background: "linear-gradient(180deg, hsl(60 10% 98%) 0%, hsl(220 5% 56%) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Dibuat untuk Creator Indonesia
        </h2>
        <p
          className={`mx-auto mt-4 max-w-[520px] text-center font-body text-base text-muted-foreground sm:text-lg ${isVisible ? "animate-fade-up" : "opacity-0"}`}
          style={{ animationDelay: "0.2s" }}
        >
          Dari affiliate marketer sampai brand lokal — GENBOX bikin konten UGC jadi gampang.
        </p>

        <div className="mt-12 space-y-4">
          {cards.map((card, i) => (
            <div
              key={card.num}
              className={`flex items-start gap-5 rounded-2xl border border-border/60 bg-card/50 p-6 transition-all duration-300 hover:border-primary/20 hover:bg-card/80 ${isVisible ? "animate-fade-up" : "opacity-0"}`}
              style={{ animationDelay: `${0.3 + i * 0.1}s` }}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
                <span className="font-mono text-[12px] font-bold text-primary">{card.num}</span>
              </div>
              <div>
                <h3 className="font-satoshi text-lg font-bold text-foreground">{card.title}</h3>
                <p className="mt-1.5 font-body text-sm text-muted-foreground">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DibuatUntukSection;
