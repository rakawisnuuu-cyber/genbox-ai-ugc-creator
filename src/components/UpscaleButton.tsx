import { useState, useRef } from "react";
import { useApiKeys } from "@/hooks/useApiKeys";
import { useToast } from "@/hooks/use-toast";
import { ArrowUpFromLine, ChevronDown, Loader2 } from "lucide-react";

interface UpscaleButtonProps {
  imageUrl: string;
  onUpscaled: (newUrl: string, factor: number) => void;
  currentFactor?: number | null;
}

const UpscaleButton = ({ imageUrl, onUpscaled, currentFactor }: UpscaleButtonProps) => {
  const { kieApiKey } = useApiKeys();
  const { toast } = useToast();
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleUpscale = async (factor: number) => {
    setShowDropdown(false);
    if (!kieApiKey) {
      toast({ title: "Kie AI API key belum di-setup", variant: "destructive" });
      return;
    }
    setIsUpscaling(true);
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

      // Poll
      for (let i = 0; i < 40; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        const res = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
          headers: { Authorization: `Bearer ${kieApiKey}` },
        });
        const json = await res.json();
        const state = json?.data?.state;
        if (state === "success") {
          const resultJson = typeof json.data.resultJson === "string" ? JSON.parse(json.data.resultJson) : json.data.resultJson;
          const url = resultJson?.resultUrls?.[0] || resultJson?.url || "";
          if (!url) throw new Error("No URL in upscale result");
          onUpscaled(url, factor);
          toast({ title: `Gambar berhasil di-upscale ke ${factor}x!` });
          setIsUpscaling(false);
          return;
        }
        if (state === "fail") throw new Error("Upscale failed");
      }
      throw new Error("Upscale timeout");
    } catch (e: any) {
      toast({ title: "Upscale gagal", description: e.message, variant: "destructive" });
    } finally {
      setIsUpscaling(false);
    }
  };

  if (currentFactor) {
    return (
      <span className="bg-primary/20 text-primary text-[9px] font-bold rounded-full px-1.5 py-0.5">
        {currentFactor}x
      </span>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => isUpscaling ? null : setShowDropdown(!showDropdown)}
        disabled={isUpscaling}
        className="flex items-center gap-1.5 bg-secondary hover:bg-muted border border-border rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-60"
      >
        {isUpscaling ? (
          <><Loader2 className="h-3 w-3 animate-spin" /> Upscaling...</>
        ) : (
          <><ArrowUpFromLine className="h-3 w-3" /> Upscale <ChevronDown className="h-3 w-3" /></>
        )}
      </button>
      {showDropdown && (
        <div className="absolute bottom-full mb-1 left-0 bg-card border border-border rounded-lg shadow-lg z-10 py-1 min-w-[120px] animate-fade-in">
          <button onClick={() => handleUpscale(2)} className="w-full px-3 py-1.5 text-xs text-left hover:bg-secondary flex items-center justify-between">
            <span>2x</span>
            <span className="text-[10px] text-muted-foreground">~5 credits</span>
          </button>
          <button onClick={() => handleUpscale(4)} className="w-full px-3 py-1.5 text-xs text-left hover:bg-secondary flex items-center justify-between">
            <span>4x</span>
            <span className="text-[10px] text-muted-foreground">~10 credits</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UpscaleButton;
