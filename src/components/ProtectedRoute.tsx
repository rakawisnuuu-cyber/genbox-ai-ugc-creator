import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  const [trialExpired, setTrialExpired] = useState(false);
  const [checkingTrial, setCheckingTrial] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) {
      setCheckingTrial(false);
      return;
    }

    const checkTrial = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("trial_expires_at")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!error && data?.trial_expires_at) {
        const expiresAt = new Date(data.trial_expires_at);
        if (new Date() > expiresAt) {
          setTrialExpired(true);
        }
      }
      setCheckingTrial(false);
    };

    checkTrial();
  }, [session?.user?.id]);

  if (loading || checkingTrial) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (trialExpired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="max-w-md text-center space-y-4">
          <div className="text-5xl mb-2">⏰</div>
          <h1 className="text-2xl font-bold text-foreground font-satoshi">Trial Kamu Sudah Berakhir</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Masa early access trial kamu sudah habis. Hubungi kami untuk memperpanjang akses.
          </p>
          <a
            href="https://wa.me/6281234567890?text=Halo,%20saya%20ingin%20memperpanjang%20trial%20Genbox"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-green-600 text-white px-6 py-3 text-sm font-semibold hover:bg-green-700 transition-colors"
          >
            💬 Hubungi via WhatsApp
          </a>
          <p className="text-xs text-muted-foreground/40">
            Atau email ke <a href="mailto:support@genbox.id" className="text-primary hover:underline">support@genbox.id</a>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
