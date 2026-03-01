import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

type Provider = "kie_ai" | "gemini";
type KeyStatus = "valid" | "invalid" | "untested" | "testing";

interface ApiKeyState {
  key: string;
  status: KeyStatus;
}

export function useApiKeys() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<Record<Provider, ApiKeyState>>({
    kie_ai: { key: "", status: "untested" },
    gemini: { key: "", status: "untested" },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [savingProvider, setSavingProvider] = useState<Provider | null>(null);
  const [testingProvider, setTestingProvider] = useState<Provider | null>(null);

  const fetchKeys = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const { data } = await supabase
      .from("user_api_keys")
      .select("provider, encrypted_key")
      .eq("user_id", user.id);

    const newKeys: Record<Provider, ApiKeyState> = {
      kie_ai: { key: "", status: "untested" },
      gemini: { key: "", status: "untested" },
    };
    data?.forEach((row: any) => {
      const p = row.provider as Provider;
      if (p in newKeys) {
        newKeys[p] = { key: row.encrypted_key, status: "valid" };
      }
    });
    setKeys(newKeys);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const saveKey = async (provider: Provider, key: string) => {
    if (!user) return;
    setSavingProvider(provider);
    try {
      const { error } = await supabase
        .from("user_api_keys")
        .upsert(
          { user_id: user.id, provider, encrypted_key: key, updated_at: new Date().toISOString() },
          { onConflict: "user_id,provider" }
        );
      if (error) throw error;
      setKeys((prev) => ({ ...prev, [provider]: { key, status: "valid" } }));
      toast({ title: "API key tersimpan", description: `Key ${provider === "kie_ai" ? "Kie AI" : "Gemini"} berhasil disimpan.` });
    } catch (e: any) {
      toast({ title: "Gagal menyimpan", description: e.message, variant: "destructive" });
    } finally {
      setSavingProvider(null);
    }
  };

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
      } else {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: "Say hello" }] }] }),
          }
        );
        const json = await res.json();
        valid = !!json.candidates;
      }

      setKeys((prev) => ({ ...prev, [provider]: { ...prev[provider], status: valid ? "valid" : "invalid" } }));
      toast({
        title: valid ? "Key valid ✓" : "Key tidak valid",
        description: valid ? `API key ${provider === "kie_ai" ? "Kie AI" : "Gemini"} berhasil diverifikasi.` : "Key tidak dapat diverifikasi. Periksa kembali.",
        variant: valid ? "default" : "destructive",
      });
    } catch {
      setKeys((prev) => ({ ...prev, [provider]: { ...prev[provider], status: "invalid" } }));
      toast({ title: "Test gagal", description: "Tidak dapat terhubung ke API.", variant: "destructive" });
    } finally {
      setTestingProvider(null);
    }
  };

  return {
    kieApiKey: keys.kie_ai.key,
    geminiKey: keys.gemini.key,
    keys,
    isLoading,
    savingProvider,
    testingProvider,
    saveKey,
    testKey,
    refetch: fetchKeys,
    setLocalKey: (provider: Provider, key: string) =>
      setKeys((prev) => ({ ...prev, [provider]: { ...prev[provider], key } })),
  };
}
