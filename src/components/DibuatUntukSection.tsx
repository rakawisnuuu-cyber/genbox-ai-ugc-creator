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
    <section ref={ref} className="relative z-10 px-4 py-20 sm:py-32">
      <div className="mx-auto max-w-4xl">
        <h2
          className={`font-serif text-[32px] sm:text-[44px] lg:text-[52px] leading-[1.05] tracking-tight text-cream ${isVisible ? "animate-fade-up" : "opacity-0"}`}
          style={{ animationDelay: "0.1s" }}
        >
          Dibuat untuk
          <br />
          Creator Indonesia
        </h2>
        <p
          className={`mt-5 max-w-[520px] font-body text-base text-muted-foreground sm:text-lg ${isVisible ? "animate-fade-up" : "opacity-0"}`}
          style={{ animationDelay: "0.2s" }}
        >
          Dari affiliate marketer sampai brand lokal — GENBOX bikin konten UGC jadi gampang.
        </p>

        <div className="mt-14 grid gap-5 sm:grid-cols-3">
          {cards.map((card, i) => (
            <div
              key={card.num}
              className={`group rounded-2xl border border-border/50 bg-card/40 p-7 transition-all duration-300 hover:border-cream/20 hover:bg-card/70 hover:-translate-y-1 ${isVisible ? "animate-fade-up" : "opacity-0"}`}
              style={{ animationDelay: `${0.3 + i * 0.1}s` }}
            >
              <span className="font-mono text-[28px] font-bold leading-none text-cream/20">{card.num}</span>
              <h3 className="mt-4 font-satoshi text-lg font-bold text-foreground">{card.title}</h3>
              <p className="mt-2 font-body text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DibuatUntukSection;
