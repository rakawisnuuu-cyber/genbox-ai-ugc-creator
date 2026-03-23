import { useState } from "react";
import { Copy, Check, BookmarkPlus, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface OutputPanelProps {
  jsonOutput: string;
  naturalPrompt: string;
  mode: string;
  title: string;
  inputData: Record<string, any>;
  onGenerateAgain?: () => void;
  onSaved?: () => void;
}

export default function OutputPanel({
  jsonOutput,
  naturalPrompt,
  mode,
  title,
  inputData,
  onGenerateAgain,
  onSaved,
}: OutputPanelProps) {
  const { user } = useAuth();
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleCopy = async (text: string, type: "json" | "prompt") => {
    await navigator.clipboard.writeText(text);
    if (type === "json") {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } else {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    }
    toast({ title: "Copied!", description: `${type === "json" ? "JSON" : "Prompt"} copied to clipboard.` });
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("prompt_library" as any).insert({
        user_id: user.id,
        mode,
        title,
        json_output: jsonOutput,
        natural_prompt: naturalPrompt,
        input_data: inputData,
      } as any);
      if (error) throw error;
      toast({ title: "Tersimpan!", description: "Prompt disimpan ke library." });
      onSaved?.();
    } catch (e: any) {
      toast({ title: "Gagal menyimpan", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* JSON Output */}
      <div className="rounded-xl border border-border/30 bg-white/[0.02] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/20">
          <span className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">JSON Prompt</span>
          <button
            onClick={() => handleCopy(jsonOutput, "json")}
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-white/[0.04]"
          >
            {copiedJson ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedJson ? "Copied" : "Copy"}
          </button>
        </div>
        <div className="max-h-[400px] overflow-y-auto p-4">
          <pre className="text-[11px] font-mono leading-relaxed text-foreground/70 whitespace-pre-wrap">{jsonOutput}</pre>
        </div>
      </div>

      {/* Natural Language Prompt */}
      <div className="rounded-xl border border-border/30 bg-white/[0.02] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/20">
          <span className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Natural Language Prompt</span>
          <button
            onClick={() => handleCopy(naturalPrompt, "prompt")}
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-white/[0.04]"
          >
            {copiedPrompt ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedPrompt ? "Copied" : "Copy"}
          </button>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-4">
          <p className="text-[13px] leading-relaxed text-foreground/80">{naturalPrompt}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary text-[12px] font-semibold hover:bg-primary/20 transition-colors disabled:opacity-50"
        >
          <BookmarkPlus className="w-4 h-4" />
          {saving ? "Menyimpan..." : "Save to Library"}
        </button>
        {onGenerateAgain && (
          <button
            onClick={onGenerateAgain}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/40 text-muted-foreground text-[12px] font-semibold hover:bg-white/[0.04] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Generate Again
          </button>
        )}
      </div>
    </div>
  );
}
