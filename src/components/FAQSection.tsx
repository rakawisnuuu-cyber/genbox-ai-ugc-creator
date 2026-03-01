import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const faqs = [
  { q: "Apa itu GENBOX?", a: "GENBOX adalah platform AI yang membantu seller e-commerce Indonesia membuat foto UGC (User Generated Content) realistis tanpa perlu model, fotografer, atau studio." },
  { q: "Bagaimana cara kerja GENBOX?", a: "Kamu cukup pilih karakter AI, masukkan detail produk, dan sistem akan generate foto UGC berkualitas tinggi secara otomatis menggunakan AI." },
  { q: "Apa itu API key dan kenapa saya perlu setup sendiri?", a: "API key adalah kunci akses ke layanan AI (Kie AI & Gemini). Dengan setup sendiri, kamu punya kontrol penuh atas biaya — tanpa markup dari kami." },
  { q: "Berapa biaya API yang harus saya bayar?", a: "Biaya API bervariasi tergantung provider, tapi rata-rata sangat murah — sekitar Rp 500-2.000 per gambar yang di-generate." },
  { q: "Apa yang saya dapatkan setelah membeli?", a: "Kamu mendapat akses lifetime ke dashboard GENBOX, termasuk prompt generator otomatis, karakter AI konsisten, dan semua update fitur di masa depan." },
  { q: "Apakah ada biaya bulanan?", a: "Tidak. GENBOX menggunakan model sekali bayar Rp 249.000 untuk akses selamanya. Satu-satunya biaya tambahan adalah biaya API yang kamu bayar langsung ke provider." },
  { q: "Apakah bisa dipakai untuk Shopee, Tokopedia, TikTok Shop?", a: "Ya! Output GENBOX dioptimalkan untuk semua marketplace populer di Indonesia termasuk Shopee, Tokopedia, TikTok Shop, Lazada, dan lainnya." },
  { q: "Bagaimana kebijakan refund?", a: "Karena ini produk digital dengan akses instan, kami tidak menyediakan refund setelah akses diberikan. Pastikan kamu sudah membaca semua informasi sebelum membeli." },
];

const FAQSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section id="faq" ref={ref} className="py-24 relative">
      <div className="container mx-auto px-6 max-w-3xl">
        <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <span className="inline-block mb-4 px-4 py-1.5 rounded-full border border-primary/30 text-xs font-heading tracking-wider text-primary">
            FAQ
          </span>
          <h2 className="font-heading text-3xl md:text-4xl text-foreground">
            Pertanyaan yang Sering Ditanyakan
          </h2>
        </div>

        <div className={`transition-all duration-700 delay-200 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border border-border rounded-xl px-6 bg-card data-[state=open]:border-primary/30"
              >
                <AccordionTrigger className="text-foreground text-sm hover:no-underline py-5">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-5">
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
