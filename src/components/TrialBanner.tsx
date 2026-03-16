import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Clock } from "lucide-react";

const TrialBanner = () => {
  const { user } = useAuth();
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [expiryDate, setExpiryDate] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("trial_expires_at")
        .eq("user_id", user.id)
        .single();
      if (data?.trial_expires_at) {
        const exp = new Date(data.trial_expires_at);
        const diff = Math.ceil((exp.getTime() - Date.now()) / 86400000);
        setDaysLeft(Math.max(0, diff));
        setExpiryDate(
          exp.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
        );
      }
    };
    fetch();
  }, [user]);

  if (daysLeft === null) return null;

  const isUrgent = daysLeft <= 2;

  return (
    <div
      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium border ${
        isUrgent
          ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
          : "border-border/40 bg-card/60 text-muted-foreground"
      }`}
    >
      <Clock className={`h-3.5 w-3.5 ${isUrgent ? "text-yellow-500" : "text-muted-foreground/50"}`} />
      <span>
        Early Access — <span className="font-bold">{daysLeft} hari tersisa</span>
        <span className="hidden sm:inline text-muted-foreground/50 ml-1.5">
          (hingga {expiryDate})
        </span>
      </span>
    </div>
  );
};

export default TrialBanner;
