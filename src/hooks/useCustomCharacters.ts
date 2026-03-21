import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { CharacterData } from "@/components/CharacterCard";

/**
 * Shared hook to fetch the current user's custom characters.
 * Eliminates duplication between GeneratePage and CharactersPage.
 */
export function useCustomCharacters() {
  const [customChars, setCustomChars] = useState<CharacterData[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchCustom = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("characters")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_preset", false)
      .order("created_at", { ascending: false });
    if (data) {
      setCustomChars(
        data.map((d) => ({
          id: d.id,
          name: d.name,
          type: d.type,
          age_range: d.age_range,
          style: d.style,
          description: d.description,
          gradient_from: d.gradient_from,
          gradient_to: d.gradient_to,
          is_preset: false,
          hero_image_url: d.hero_image_url ?? undefined,
          reference_images: d.reference_images ?? undefined,
          identity_prompt: d.identity_prompt ?? undefined,
          reference_photo_url: d.reference_photo_url ?? undefined,
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCustom();
  }, [user]);

  return { customChars, loading, refetch: fetchCustom };
}
