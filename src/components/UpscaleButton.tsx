import { useState } from "react";
import { ArrowUpFromLine, ChevronDown, Loader2 } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  imageUrl: string;
  imageKey: string;
  loading: boolean;
  currentFactor: number | null;
  onUpscale: (key: string, url: string, factor: 2 | 4) => void;
}

export default function UpscaleButton({ imageUrl, imageKey, loading, currentFactor, onUpscale }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          disabled={loading}
          className="inline-flex items-center gap-1.5 bg-[hsl(0_0%_10%)] hover:bg-[hsl(0_0%_16%)] border border-border rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowUpFromLine className="h-3 w-3" />}
          {loading ? "Upscaling..." : currentFactor ? `Upscaled ${currentFactor}x` : "Upscale"}
          <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        <DropdownMenuItem onClick={() => onUpscale(imageKey, imageUrl, 2)} className="flex justify-between">
          <span>Upscale 2x</span>
          <span className="text-[10px] text-muted-foreground">~5 credits</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onUpscale(imageKey, imageUrl, 4)} className="flex justify-between">
          <span>Upscale 4x</span>
          <span className="text-[10px] text-muted-foreground">~10 credits</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
