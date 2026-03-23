import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
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

const FAQItem = ({
  faq,
  isOpen,
  onToggle,
  index,
}: {
  faq: { q: string; a: string };
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: 0.1 + index * 0.06, ease: [0.16, 1, 0.3, 1] }}
    className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden transition-colors duration-200 hover:border-border/60"
  >
    <button
      onClick={onToggle}
      className="flex w-full items-center justify-between px-5 py-4 sm:px-6 sm:py-5 text-left"
    >
      <span className="font-satoshi text-[14px] sm:text-[15px] font-semibold text-foreground pr-4">
        {faq.q}
      </span>
      <motion.div
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full border border-border/50 bg-secondary/50"
      >
        <Plus className="w-3.5 h-3.5 text-muted-foreground" />
      </motion.div>
    </button>

    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          <div className="px-5 pb-4 sm:px-6 sm:pb-5 pt-0">
            <p className="text-[13px] sm:text-sm text-muted-foreground leading-relaxed">
              {faq.a}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

const FAQSection = () => {
  const { ref, isVisible } = useScrollReveal();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" ref={ref} className="relative z-10 px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-xl lg:max-w-3xl">
        <h2
          className={`text-center font-satoshi text-[28px] font-bold leading-tight tracking-tight sm:text-[36px] mb-8 sm:mb-10 ${isVisible ? "animate-fade-up" : "opacity-0"}`}
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

        {isVisible && (
          <div className="flex flex-col gap-3">
            {faqs.map((faq, i) => (
              <FAQItem
                key={i}
                faq={faq}
                index={i}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FAQSection;
