import { useState } from "react";
import { useApiKeys } from "@/hooks/useApiKeys";
import { toast } from "@/hooks/use-toast";

interface UpscaleState {
  loading: boolean;
  resultUrl: string | null;
  factor: number | null;
}

export function useUpscale() {
  const { kieApiKey } = useApiKeys();
  const [state, setState] = useState<Record<string, UpscaleState>>({});

  const upscale = async (imageKey: string, imageUrl: string, factor: 2 | 4): Promise<string | null> => {
    if (!kieApiKey) {
      toast({ title: "Kie AI API key belum di-setup", variant: "destructive" });
      return null;
    }

    setState((p) => ({ ...p, [imageKey]: { loading: true, resultUrl: null, factor } }));

    try {
      const createRes = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
        method: "POST",
        headers: { Authorization: `Bearer ${kieApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "topaz/image-upscale",
          input: { image_url: imageUrl, upscale_factor: String(factor) },
        }),
      });
      const createJson = await createRes.json();
      if (createJson.code !== 200 || !createJson.data?.taskId) throw new Error("Failed to create upscale task");

      const taskId = createJson.data.taskId;

      for (let i = 0; i < 40; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        const r = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
          headers: { Authorization: `Bearer ${kieApiKey}` },
        });
        const j = await r.json();
        if (j.data?.state === "success") {
          const resultJson = typeof j.data.resultJson === "string" ? JSON.parse(j.data.resultJson) : j.data.resultJson;
          const url = resultJson?.resultUrls?.[0] || resultJson?.url || "";
          setState((p) => ({ ...p, [imageKey]: { loading: false, resultUrl: url, factor } }));
          toast({ title: `Gambar berhasil di-upscale ke ${factor}x!` });
          return url;
        }
        if (j.data?.state === "fail") throw new Error("Upscale failed");
      }
      throw new Error("Timeout");
    } catch (e: any) {
      setState((p) => ({ ...p, [imageKey]: { loading: false, resultUrl: null, factor: null } }));
      toast({ title: "Upscale gagal", description: e.message, variant: "destructive" });
      return null;
    }
  };

  const getState = (key: string): UpscaleState => state[key] || { loading: false, resultUrl: null, factor: null };

  return { upscale, getState };
}
