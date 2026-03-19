import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const faqs = [
  {
    q: "Apa itu GENBOX?",
    a: "Platform AI untuk generate gambar dan video UGC realistis. Upload foto produk, pilih karakter, AI generate konten yang siap posting ke TikTok dan Instagram. Tanpa hire model, tanpa studio.",
  },
  {
    q: "BYOK itu apa?",
    a: "BYOK (Bring Your Own Key) artinya kamu pakai API key sendiri untuk generate. Biaya langsung ke provider AI — mulai dari Rp 440/gambar. Platform GENBOX-nya sekali bayar, akses selamanya. Tanpa langganan bulanan.",
  },
  {
    q: "Bedanya apa dengan AI image tool lain?",
    a: "GENBOX fokus di satu hal: UGC yang kelihatan real. Bukan gambar AI yang obvious. Kita pakai prompt system khusus untuk skin texture, lighting, dan angle yang bikin hasil generate kayak difoto beneran pakai HP. Plus karakter bisa dikustomisasi sesuai target market Indonesia.",
  },
];

const FAQSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section id="faq" ref={ref} className="relative z-10 px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-2xl">
        <h2
          className={`text-center font-satoshi text-[28px] font-bold leading-tight tracking-tight sm:text-[36px] ${isVisible ? "animate-fade-up" : "opacity-0"}`}
          style={{
            animationDelay: "0.1s",
            background: "linear-gradient(180deg, hsl(60 10% 98%) 0%, hsl(220 5% 56%) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          FAQ
        </h2>

        <Accordion
          type="single"
          collapsible
          className={`mt-8 ${isVisible ? "animate-fade-up" : "opacity-0"}`}
          style={{ animationDelay: "0.2s" }}
        >
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border-border/40">
              <AccordionTrigger className="text-left font-satoshi text-[15px] font-bold text-foreground hover:text-primary transition-colors py-5">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
