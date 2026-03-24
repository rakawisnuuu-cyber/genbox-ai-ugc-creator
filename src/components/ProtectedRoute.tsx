import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  const [checkLoading, setCheckLoading] = useState(true);
  const [trialExpired, setTrialExpired] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) {
      setCheckLoading(false);
      return;
    }

    const checkAccess = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("trial_expires_at, is_paid")
        .eq("user_id", session.user.id)
        .single();

      // Paid users bypass trial check
      if (data?.is_paid) {
        setCheckLoading(false);
        return;
      }

      if (data?.trial_expires_at && new Date() > new Date(data.trial_expires_at)) {
        const { data: roleData } = await supabase.rpc("has_role", {
          _user_id: session.user.id,
          _role: "admin",
        });
        setTrialExpired(!roleData);
      }
      setCheckLoading(false);
    };

    checkAccess();
  }, [session?.user?.id]);

  if (loading || checkLoading) {
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
