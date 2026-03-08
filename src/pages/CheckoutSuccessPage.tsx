import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, Mail, LogIn, Key, ArrowRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const steps = [
  { icon: Mail, label: "Cek email kamu untuk detail login" },
  { icon: LogIn, label: "Login ke dashboard GENBOX" },
  { icon: Key, label: "Setup API keys dan mulai generate" },
];

const maskEmail = (email: string) => {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, 1);
  return `${visible}***@${domain}`;
};

const CheckoutSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowSteps(true), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      {/* Subtle radial glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: "radial-gradient(ellipse at center, hsla(75,85%,52%,0.04) 0%, transparent 60%)",
        }}
      />

      <div className="relative w-full max-w-md text-center py-16">
        {/* Animated checkmark */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
          className="mx-auto mb-8"
        >
          <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
            {/* Glow ring */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.3, opacity: 0 }}
              transition={{ duration: 1.5, delay: 0.4, repeat: Infinity, repeatDelay: 2 }}
              className="absolute inset-0 rounded-full bg-primary/20"
            />
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.3 }}
              >
                <CheckCircle className="h-10 w-10 text-primary" />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="font-satoshi text-2xl sm:text-3xl font-bold tracking-tight"
        >
          Pembayaran Berhasil!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="mt-3 text-muted-foreground"
        >
          Cek email kamu untuk detail login
        </motion.p>

        {/* Email display */}
        {email && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/80 px-5 py-3"
          >
            <Mail className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {maskEmail(email)}
            </span>
          </motion.div>
        )}

        {/* Next steps */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showSteps ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          className="mt-10"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-5">
            Langkah Selanjutnya
          </p>
          <div className="space-y-3">
            {steps.map((step, i) => (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: showSteps ? 1 : 0, x: showSteps ? 0 : -16 }}
                transition={{ duration: 0.4, delay: i * 0.15 }}
                className="flex items-center gap-4 rounded-xl border border-border/60 bg-card/80 px-5 py-4 text-left"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <step.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary">{i + 1}.</span>
                  <span className="text-sm text-muted-foreground">{step.label}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: showSteps ? 1 : 0, y: showSteps ? 0 : 12 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-10"
        >
          <Button asChild className="h-13 w-full rounded-xl bg-primary text-sm font-bold tracking-wider text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-6px_hsl(var(--primary)/0.4)]">
            <Link to="/login" className="flex items-center gap-2">
              Login Sekarang
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>

        {/* Support link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: showSteps ? 1 : 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
          className="mt-6 text-xs text-muted-foreground"
        >
          Belum dapat email?{" "}
          <a
            href="https://wa.me/6281234567890"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <MessageCircle className="h-3 w-3" />
            Hubungi kami
          </a>
        </motion.p>
      </div>
    </div>
  );
};

export default CheckoutSuccessPage;
