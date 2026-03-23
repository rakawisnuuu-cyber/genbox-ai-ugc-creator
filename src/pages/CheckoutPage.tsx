import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Lock, Zap, Infinity, Shield, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const features = [
  "Generate gambar unlimited",
  "Generate video unlimited",
  "10+ karakter + kustomisasi",
  "Output tanpa watermark",
  "AI Prompt Generator",
  "n8n automation blueprint",
  "Lifetime updates",
  "WhatsApp support group",
];

const trustBadges = [
  { icon: Lock, label: "Pembayaran Aman" },
  { icon: Zap, label: "Akses Instant" },
  { icon: Infinity, label: "Lifetime Updates" },
];

const paymentMethods = [
  "QRIS",
  "GoPay",
  "ShopeePay",
  "OVO",
  "Virtual Account",
  "Kartu Kredit",
];

const CheckoutPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Masukkan email yang valid");
      return;
    }

    setLoading(true);

    // @ts-ignore - Midtrans Snap loaded via script
    if (typeof window.snap === "undefined") {
      toast.error("Payment gateway sedang dimuat, coba lagi.");
      setLoading(false);
      return;
    }

    try {
      // TODO: Call backend edge function to create Midtrans transaction
      // For now, show a placeholder message
      toast.info("Midtrans Snap integration — hubungkan edge function untuk membuat transaksi.");
      setLoading(false);
    } catch {
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Midtrans Snap Script */}
      <script
        src="https://app.midtrans.com/snap/snap.js"
        data-client-key="YOUR_MIDTRANS_CLIENT_KEY"
      />

      {/* Header */}
      <header className="border-b border-border/60 bg-background/85 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-4 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Secure Checkout</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left — Order Summary */}
          <div>
            <h1 className="font-satoshi text-2xl font-bold tracking-tight sm:text-3xl">
              Order Summary
            </h1>

            <div className="mt-8 rounded-2xl border border-border/60 bg-card/80 p-6 sm:p-8">
              {/* Product */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-satoshi text-lg font-bold text-foreground">
                    GENBOX BYOK
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Lifetime Access
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm text-muted-foreground/60 line-through">
                    Rp 249.000
                  </p>
                  <p className="font-satoshi text-2xl font-bold text-foreground">
                    Rp 149.000
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="my-6 h-px bg-border/60" />

              {/* Features */}
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-4">
                Yang kamu dapat
              </p>
              <ul className="space-y-3">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Check className="h-3 w-3 text-primary" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* Divider */}
              <div className="my-6 h-px bg-border/60" />

              {/* Total */}
              <div className="flex items-center justify-between">
                <p className="font-satoshi font-bold text-foreground">Total</p>
                <p className="font-satoshi text-xl font-bold text-foreground">
                  Rp 149.000
                </p>
              </div>
            </div>
          </div>

          {/* Right — Payment Form */}
          <div>
            <h2 className="font-satoshi text-2xl font-bold tracking-tight sm:text-3xl">
              Pembayaran
            </h2>

            <div className="mt-8 rounded-2xl border border-border/60 bg-card/80 p-6 sm:p-8">
              {/* Email */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="flex items-center gap-2 text-sm font-medium text-foreground"
                >
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl border-border/60 bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:border-primary"
                />
                <p className="text-xs text-muted-foreground">
                  Credentials akan dikirim ke email ini
                </p>
              </div>

              {/* Pay Button */}
              <Button
                onClick={handlePay}
                disabled={loading}
                className="mt-8 h-14 w-full rounded-xl bg-primary text-sm font-bold tracking-wider text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-6px_hsl(var(--primary)/0.4)]"
              >
                {loading ? "Memproses..." : "Bayar Sekarang — Rp 149.000"}
              </Button>

              {/* Trust badges */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-6">
                {trustBadges.map((t) => (
                  <div
                    key={t.label}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <t.icon className="h-3.5 w-3.5 text-primary" />
                    {t.label}
                  </div>
                ))}
              </div>

              {/* Payment methods */}
              <div className="mt-6 h-px bg-border/60" />
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {paymentMethods.map((m) => (
                  <span
                    key={m}
                    className="rounded-lg border border-border/60 bg-secondary/30 px-3 py-1.5 text-[11px] text-muted-foreground"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CheckoutPage;
