import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  const [trialLoading, setTrialLoading] = useState(true);
  const [trialExpired, setTrialExpired] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) {
      setTrialLoading(false);
      return;
    }

    const checkTrial = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("trial_expires_at")
        .eq("user_id", session.user.id)
        .single();

      if (data?.trial_expires_at && new Date() > new Date(data.trial_expires_at)) {
        // Check if user is admin — admins bypass trial
        const { data: roleData } = await supabase.rpc("has_role", {
          _user_id: session.user.id,
          _role: "admin",
        });
        setTrialExpired(!roleData);
      }
      setTrialLoading(false);
    };

    checkTrial();
  }, [session?.user?.id]);

  if (loading || trialLoading) {
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
    return <Navigate to="/trial-expired" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
