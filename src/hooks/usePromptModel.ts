import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const DEFAULT_MODEL = "gemini-2.5-flash";

export function usePromptModel() {
  const { user } = useAuth();
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [isLoading, setIsLoading] = useState(true);

  const fetchModel = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const { data } = await supabase
      .from("user_settings")
      .select("value")
      .eq("user_id", user.id)
      .eq("key", "prompt_model")
      .maybeSingle();
    if (data?.value) setModel(data.value);
    setIsLoading(false);
  }, [user]);

  useEffect(() => { fetchModel(); }, [fetchModel]);

  const saveModel = async (newModel: string) => {
    if (!user) return;
    setModel(newModel);
    await supabase
      .from("user_settings")
      .upsert(
        { user_id: user.id, key: "prompt_model", value: newModel, updated_at: new Date().toISOString() },
        { onConflict: "user_id,key" }
      );
  };

  return { model, isLoading, saveModel };
}
