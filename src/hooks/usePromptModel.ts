import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const DEFAULT_MODEL = "gemini-2.5-flash";

export function usePromptModel() {
  const { user } = useAuth();
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_settings")
      .select("value")
      .eq("user_id", user.id)
      .eq("key", "prompt_model")
      .maybeSingle();
    if (data?.value) setModel(data.value);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const setPromptModel = async (val: string) => {
    if (!user) return;
    setModel(val);
    await supabase
      .from("user_settings")
      .upsert(
        { user_id: user.id, key: "prompt_model", value: val, updated_at: new Date().toISOString() },
        { onConflict: "user_id,key" }
      );
  };

  return { model, setPromptModel, loading };
}
