import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, ArrowRight, MessageCircle } from "lucide-react";

const PAYMENT_URL = "https://clicky.id/rkaaw/link/ugc-genboxid";
const TG_URL = "https://t.me/genaborz";

interface BYOKDisclaimerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BYOKDisclaimerModal = ({ open, onOpenChange }: BYOKDisclaimerModalProps) => {
  const handleProceed = () => {
    window.open(PAYMENT_URL, "_blank", "noopener,noreferrer");
    onOpenChange(false);
  };

  const handleAsk = () => {
    window.open(TG_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border/60 bg-card p-0 gap-0 sm:rounded-2xl">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2 font-satoshi text-xl font-bold text-foreground">
            <span className="text-2xl">⚠️</span>
            Baca Dulu Sebelum Beli!
          </DialogTitle>
        </DialogHeader>

        {/* Amber disclaimer box */}
        <div className="mx-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div className="space-y-3 text-sm text-amber-200/90">
              <p>
                Genbox menggunakan sistem{" "}
                <span className="font-bold text-amber-300">BYOK (Bring Your Own Key)</span>.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                  <span>
                    Pembayaran di sini = <strong className="text-amber-300">akses ke platform Genbox</strong> saja.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                  <span>
                    Biaya pemakaian API <strong className="text-amber-300">terpisah</strong> — dibayar langsung ke provider (Kie.ai / Google AI Studio).
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 p-6 pt-5">
          <button
            onClick={handleProceed}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold tracking-wider text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-6px_hsl(var(--primary)/0.4)]"
          >
            Saya Mengerti, Lanjut Beli
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={handleAsk}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/60 bg-secondary/50 py-3.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <MessageCircle className="h-4 w-4" />
            Tanya Dulu
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BYOKDisclaimerModal;
