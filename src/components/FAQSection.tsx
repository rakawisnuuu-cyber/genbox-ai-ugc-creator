import { Sparkles } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const faqs = [
  {
    q: "Apa itu GENBOX?",
    a: "GENBOX adalah platform AI yang bantu kamu generate gambar dan video UGC realistis buat jualan online. Tinggal upload foto produk, pilih karakter, dan AI generate konten yang siap posting.",
  },
  {
    q: "Bedanya apa dengan platform lain?",
    a: "GENBOX fokus di satu hal: generate gambar UGC yang kelihatan natural, kayak difoto beneran pakai HP. Kamu pakai API key sendiri (BYOK) jadi generate unlimited tanpa batas kredit, dan karakter bisa dikustomisasi sesuai target market Indonesia — hijab, casual, profesional, dll.",
  },
  {
    q: "Bayarnya gimana?",
    a: "Satu kali bayar Rp 249.000, akses selamanya. Bisa bayar pakai QRIS, GoPay, OVO, Dana, ShopeePay, atau transfer bank. Gak ada langganan bulanan.",
  },
  {
    q: "BYOK itu apa sih?",
    a: "BYOK (Bring Your Own Key) artinya kamu pakai API key sendiri buat generate tanpa batas. Biaya API langsung ke provider, cuma ~Rp 150-500 per gambar. Platform GENBOX-nya sekali bayar selamanya.",
  },
  {
    q: "Gimana cara setupnya?",
    a: "Setelah bayar, kamu dapat username & password via WhatsApp. Login, masukkan API key di Settings, langsung bisa generate. Setup kurang dari 2 menit.",
  },
];

const FAQSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section id="faq" className="relative py-24 sm:py-32 overflow-hidden">
      {/* Decorative glow */}
      <div
        className="pointer-events-none absolute -right-32 top-1/2 h-[350px] w-[350px] rounded-full opacity-[0.03]"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
        }}
      />

      <div ref={ref} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Badge */}
        <div
          className={`flex justify-center mb-6 ${isVisible ? "animate-fade-up" : "opacity-0"}`}
          style={{ animationDelay: "0.1s" }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            FAQ
          </span>
        </div>

        <h2
          className={`text-center font-satoshi text-2xl sm:text-3xl lg:text-4xl font-bold uppercase tracking-wide text-foreground ${isVisible ? "animate-fade-up" : "opacity-0"}`}
          style={{ animationDelay: "0.2s" }}
        >
          PERTANYAAN YANG SERING DITANYA
        </h2>

        <div
          className={`mx-auto mt-12 max-w-[700px] ${isVisible ? "animate-fade-up" : "opacity-0"}`}
          style={{ animationDelay: "0.3s" }}
        >
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="rounded-xl border border-border bg-card px-5"
              >
                <AccordionTrigger className="min-h-[44px] py-5 font-satoshi text-base font-semibold text-foreground hover:no-underline [&>svg]:text-primary">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
