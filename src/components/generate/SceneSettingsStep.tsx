import React from "react";
import { ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { RichOption } from "@/lib/category-options";

interface SceneSettingsStepProps {
  background: string;
  setBackground: (v: string) => void;
  customBg: string;
  setCustomBg: (v: string) => void;
  pose: string;
  setPose: (v: string) => void;
  mood: string;
  setMood: (v: string) => void;
  envOptions: RichOption[];
  poseOptions: RichOption[];
  moodOptions: RichOption[];
  advancedOpen: boolean;
  setAdvancedOpen: (v: boolean) => void;
}

const SceneSettingsStep: React.FC<SceneSettingsStepProps> = ({
  background,
  setBackground,
  customBg,
  setCustomBg,
  pose,
  setPose,
  mood,
  setMood,
  envOptions,
  poseOptions,
  moodOptions,
  advancedOpen,
  setAdvancedOpen,
}) => {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 space-y-4">
      {/* Environment — top level */}
      <div>
        <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/30 block mb-2">
          Background / Environment
        </label>
        <Select value={background} onValueChange={setBackground}>
          <SelectTrigger className="bg-white/[0.03] border-white/[0.06]">
            <SelectValue placeholder="Pilih environment..." />
          </SelectTrigger>
          <SelectContent>
            {envOptions.map((opt) => (
              <SelectItem key={opt.label} value={opt.label}>
                <div className="flex flex-col">
                  <span>{opt.label}</span>
                  {opt.description && (
                    <span className="text-[10px] text-muted-foreground truncate max-w-[250px]">
                      {opt.description.slice(0, 55)}…
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {background === "Custom" && (
          <Input
            value={customBg}
            onChange={(e) => setCustomBg(e.target.value)}
            placeholder="Deskripsikan environment secara detail..."
            className="mt-2 bg-white/[0.03] border-white/[0.06]"
          />
        )}
      </div>

      {/* Advanced — collapsible */}
      <div>
        <button
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className="flex items-center gap-2 text-[11px] text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors"
        >
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
          <span className="font-medium">Advanced options</span>
        </button>
        {advancedOpen && (
          <div className="mt-3 bg-white/[0.02] rounded-xl p-4 border border-white/[0.04] space-y-4">
            <p className="text-[10px] text-muted-foreground/25">
              Optional — storyboard beats handle pose per frame
            </p>
            <div>
              <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/30 block mb-2">
                Pose
              </label>
              <Select value={pose} onValueChange={setPose}>
                <SelectTrigger className="bg-white/[0.03] border-white/[0.06]">
                  <SelectValue placeholder="Pilih pose..." />
                </SelectTrigger>
                <SelectContent>
                  {poseOptions.map((opt) => (
                    <SelectItem key={opt.label} value={opt.label}>
                      <div className="flex flex-col">
                        <span>{opt.label}</span>
                        <span className="text-[10px] text-muted-foreground truncate max-w-[250px]">
                          {opt.description.slice(0, 55)}…
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/30 block mb-2">
                Mood
              </label>
              <Select value={mood} onValueChange={setMood}>
                <SelectTrigger className="bg-white/[0.03] border-white/[0.06]">
                  <SelectValue placeholder="Pilih mood..." />
                </SelectTrigger>
                <SelectContent>
                  {moodOptions.map((opt) => (
                    <SelectItem key={opt.label} value={opt.label}>
                      <div className="flex flex-col">
                        <span>{opt.label}</span>
                        <span className="text-[10px] text-muted-foreground truncate max-w-[250px]">
                          {opt.description.slice(0, 55)}…
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SceneSettingsStep;
