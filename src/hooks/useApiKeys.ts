import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { setLLMFallbackKeys } from "@/lib/gemini-fetch";

type Provider = "kie_ai" | "google" | "openrouter";
type KeyStatus = "valid" | "invalid" | "untested" | "testing";

interface ApiKeyState {
  key: string;
  status: KeyStatus;
}

const PROVIDER_LABELS: Record<Provider, string> = {
  kie_ai: "Kie AI",
  google: "Google AI Studio",
  openrouter: "OpenRouter",
};

export function useApiKeys() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<Record<Provider, ApiKeyState>>({
    kie_ai: { key: "", status: "untested" },
    google: { key: "", status: "untested" },
    openrouter: { key: "", status: "untested" },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [savingProvider, setSavingProvider] = useState<Provider | null>(null);
  const [testingProvider, setTestingProvider] = useState<Provider | null>(null);

  // ── Sync fallback keys to gemini-fetch module ─────────
  useEffect(() => {
    setLLMFallbackKeys({
      google: keys.google.status === "valid" ? keys.google.key : undefined,
      openrouter: keys.openrouter.status === "valid" ? keys.openrouter.key : undefined,
    });
  }, [keys.google.key, keys.google.status, keys.openrouter.key, keys.openrouter.status]);

  // ── Fetch keys from DB ────────────────────────────────
  const fetchKeys = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const { data } = await supabase.from("user_api_keys").select("provider, encrypted_key").eq("user_id", user.id);

    const newKeys: Record<Provider, ApiKeyState> = {
      kie_ai: { key: "", status: "untested" },
      google: { key: "", status: "untested" },
      openrouter: { key: "", status: "untested" },
    };

    data?.forEach((row: any) => {
      const p = row.provider as string;
      // Backward compat: old "gemini" rows become "google"
      const mapped: Provider = p === "gemini" ? "google" : (p as Provider);
      if (mapped in newKeys) {
        newKeys[mapped] = { key: row.encrypted_key, status: "valid" };
      }
    });

    setKeys(newKeys);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  // ── Save key to DB ────────────────────────────────────
  const saveKey = async (provider: Provider, key: string) => {
    if (!user) return;
    setSavingProvider(provider);
    try {
      const { error } = await supabase
        .from("user_api_keys")
        .upsert(
          { user_id: user.id, provider, encrypted_key: key, updated_at: new Date().toISOString() },
          { onConflict: "user_id,provider" },
        );
      if (error) throw error;
      setKeys((prev) => ({ ...prev, [provider]: { key, status: "valid" } }));
      toast({ title: "API key tersimpan", description: `Key ${PROVIDER_LABELS[provider]} berhasil disimpan.` });
    } catch (e: any) {
      toast({ title: "Gagal menyimpan", description: e.message, variant: "destructive" });
    } finally {
      setSavingProvider(null);
    }
  };

  // ── Test key ──────────────────────────────────────────
  const testKey = async (provider: Provider) => {
    const key = keys[provider].key;
    if (!key) {
      toast({ title: "Key kosong", description: "Masukkan API key terlebih dahulu.", variant: "destructive" });
      return;
    }
    setTestingProvider(provider);
    setKeys((prev) => ({ ...prev, [provider]: { ...prev[provider], status: "testing" } }));

    try {
      let valid = false;

      if (provider === "kie_ai") {
        const res = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({ test: true }),
        });
        const json = await res.json();
        valid = json.code === 200 || res.ok;
      } else if (provider === "google") {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: "Say hello" }] }] }),
          },
        );
        const json = await res.json();
        valid = !!json.candidates;
      } else if (provider === "openrouter") {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: "Say hello" }],
            max_tokens: 5,
          }),
        });
        const json = await res.json();
        valid = !!json.choices;
      }

      setKeys((prev) => ({ ...prev, [provider]: { ...prev[provider], status: valid ? "valid" : "invalid" } }));
      toast({
        title: valid ? "Key valid ✓" : "Key tidak valid",
        description: valid
          ? `API key ${PROVIDER_LABELS[provider]} berhasil diverifikasi.`
          : "Key tidak dapat diverifikasi. Periksa kembali.",
        variant: valid ? "default" : "destructive",
      });
    } catch {
      setKeys((prev) => ({ ...prev, [provider]: { ...prev[provider], status: "invalid" } }));
      toast({ title: "Test gagal", description: "Tidak dapat terhubung ke API.", variant: "destructive" });
    } finally {
      setTestingProvider(null);
    }
  };

  // ── Delete key ────────────────────────────────────────
  const deleteKey = async (provider: Provider) => {
    if (!user) return;
    try {
      await supabase.from("user_api_keys").delete().eq("user_id", user.id).eq("provider", provider);
      setKeys((prev) => ({ ...prev, [provider]: { key: "", status: "untested" } }));
      toast({ title: "Key dihapus", description: `Key ${PROVIDER_LABELS[provider]} telah dihapus.` });
    } catch (e: any) {
      toast({ title: "Gagal menghapus", description: e.message, variant: "destructive" });
    }
  };

  // Backward-compat: many callers use keys.gemini.status / keys.gemini.key
  // We alias it to kie_ai so those checks pass when Kie AI key is valid.
  const backwardCompatKeys = {
    ...keys,
    gemini: keys.kie_ai,
  };

  return {
    // Primary key — used for image gen, video gen, upscale, AND LLM (via Kie AI)
    kieApiKey: keys.kie_ai.key,

    // Alias: downstream callers still reference geminiKey — now points to Kie AI key
    geminiKey: keys.kie_ai.key,

    // Full state (includes keys.gemini alias for backward compat)
    keys: backwardCompatKeys,
    isLoading,
    savingProvider,
    testingProvider,
    saveKey,
    testKey,
    deleteKey,
    refetch: fetchKeys,
    setLocalKey: (provider: Provider, key: string) =>
      setKeys((prev) => ({ ...prev, [provider]: { ...prev[provider], key } })),
  };
}
