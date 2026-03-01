import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const FinalCTASection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section ref={ref} className="py-24 relative">
      <div className="container mx-auto px-6 text-center">
        <div className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <h2 className="font-heading text-3xl md:text-5xl text-foreground mb-4">
            Mulai Sekarang
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-10">
            Siap bikin konten UGC yang membawa penjualan? Hubungi kami via WhatsApp untuk pembelian dan support.
          </p>

          <a
            href="https://wa.me/6281234567890"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              size="lg"
              className="font-heading text-sm tracking-wider px-8 py-6 bg-primary text-primary-foreground hover:bg-primary/90 glow-lime rounded-xl gap-3"
            >
              <MessageCircle className="w-5 h-5" />
              HUBUNGI VIA WHATSAPP
            </Button>
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="container mx-auto px-6 mt-24 pt-8 border-t border-border">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-heading text-sm tracking-widest text-primary">GENBOX</span>
          <span className="text-muted-foreground text-xs">© 2026 GENBOX. All rights reserved.</span>
        </div>
      </div>
    </section>
  );
};

export default FinalCTASection;
