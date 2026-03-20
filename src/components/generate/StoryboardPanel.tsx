import React from "react";
import { Loader2, Film, RefreshCw, Play, ArrowRight, Image as ImageIcon, Download } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { CONTENT_TEMPLATES, type ContentTemplateKey } from "@/lib/content-templates";
import { getStoryRoleColor, type StoryboardBeat } from "@/lib/storyboard-angles";
import type { ShotStatus } from "@/lib/generate-types";
import type { CharacterData } from "@/components/CharacterCard";
import type { ProductDNA } from "@/lib/product-dna";

interface StoryboardPanelProps {
  hasPrompts: boolean;
  promptsLoading: boolean;
  storyboardActive: boolean;
  storyboardTemplate: ContentTemplateKey;
  currentBeats: StoryboardBeat[];
  generatedPrompts: string[];
  shotStatuses: ShotStatus[];
  storyboardElapsed: number;
  completedShots: number;
  failedShots: number;
  totalShots: number;
  storyboardDone: boolean;
  selectedChar: CharacterData | null;
  productDNA: ProductDNA | null;
  updatePromptText: (idx: number, text: string) => void;
  generateSingleFrame: (idx: number) => void;
  generateAllFrames: () => void;
  cancelStoryboard: () => void;
  resetStoryboard: () => void;
  navigate: (path: string, state?: any) => void;
  kieApiKey: string;
}

const StoryboardPanel: React.FC<StoryboardPanelProps> = ({
  hasPrompts,
  promptsLoading,
  storyboardActive,
  storyboardTemplate,
  currentBeats,
  generatedPrompts,
  shotStatuses,
  storyboardElapsed,
  completedShots,
  failedShots,
  totalShots,
  storyboardDone,
  selectedChar,
  productDNA,
  updatePromptText,
  generateSingleFrame,
  generateAllFrames,
  cancelStoryboard,
  resetStoryboard,
  navigate,
  kieApiKey,
}) => {
  return (
    <>
      {/* State A: Empty — no prompts yet */}
      {!hasPrompts && !promptsLoading && (
        <div className="flex flex-col items-center text-center w-full animate-fade-in mt-12">
          {/* Minimal stacked rectangles illustration */}
          <div className="relative mb-6 h-20 w-28">
            <div className="absolute top-0 left-2 right-2 h-14 rounded-lg border border-white/[0.06]" />
            <div className="absolute top-2 left-1 right-1 h-14 rounded-lg border border-white/[0.06]" />
            <div className="absolute top-4 left-0 right-0 h-14 rounded-lg border border-white/[0.08] bg-white/[0.02]" />
          </div>
          <p className="text-sm text-muted-foreground/30">Your storyboard will appear here</p>
          <p className="text-[11px] text-muted-foreground/20 mt-1">Upload product & select character to begin</p>
          {storyboardTemplate && (
            <div className="mt-6 w-full">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/20 font-medium mb-3 text-left">
                Preview Beats — {CONTENT_TEMPLATES.find((t) => t.key === storyboardTemplate)?.label}
              </p>
              <div className="space-y-0">
                {currentBeats.map((beat, i) => {
                  const roleColor = getStoryRoleColor(beat.storyRole, i);
                  const bgClass = roleColor.split(" ")[0];
                  const textClass = roleColor.split(" ")[1];
                  return (
                    <div key={i} className="flex gap-3 items-start">
                      {/* Left: number circle + connector */}
                      <div className="flex flex-col items-center shrink-0">
                        <div
                          className={`w-7 h-7 rounded-lg ${bgClass} border border-current/10 flex items-center justify-center`}
                        >
                          <span className={`text-[11px] font-bold ${textClass}`}>{i + 1}</span>
                        </div>
                        {i < currentBeats.length - 1 && <div className="w-px h-6 bg-border/40 mx-auto" />}
                      </div>
                      {/* Right: role pill + label + description */}
                      <div className="pb-4 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${bgClass} ${textClass}`}
                          >
                            {beat.storyRole}
                          </span>
                          <span className="text-[13px] font-medium text-foreground">{beat.label}</span>
                        </div>
                        <p className="text-[12px] text-muted-foreground/50 leading-relaxed">{beat.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading prompts */}
      {promptsLoading && (
        <div className="flex flex-col items-center text-center w-full animate-fade-in mt-16">
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
          <p className="text-sm text-muted-foreground/40">Generating prompts...</p>
          <p className="text-xs text-muted-foreground/20 mt-1">
            Gemini sedang membuat {currentBeats.length} prompt untuk storyboard
          </p>
        </div>
      )}

      {/* State B: Prompts ready — editable cards with per-frame Generate */}
      {hasPrompts && !promptsLoading && (
        <div className="w-full space-y-4 animate-fade-in">
          {/* Top bar */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-foreground">
              {storyboardDone ? (
                <span className="flex items-center gap-1.5">
                  <span className="bg-emerald-500/10 text-emerald-400 rounded-md px-2 py-0.5 text-[10px]">
                    {completedShots} selesai
                  </span>
                  {failedShots > 0 && (
                    <span className="bg-red-500/10 text-red-400 rounded-md px-2 py-0.5 text-[10px]">
                      {failedShots} gagal
                    </span>
                  )}
                </span>
              ) : storyboardActive ? (
                <>
                  Generating...{" "}
                  <span className="text-primary">
                    ({completedShots}/{totalShots})
                  </span>
                </>
              ) : (
                <>Review & Edit Prompts ({generatedPrompts.length} beats)</>
              )}
            </p>
            <div className="flex items-center gap-2">
              {storyboardActive && (
                <>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {Math.floor(storyboardElapsed / 60)}:{String(storyboardElapsed % 60).padStart(2, "0")}
                  </span>
                  <button onClick={cancelStoryboard} className="text-[10px] text-destructive hover:underline">
                    Cancel
                  </button>
                </>
              )}
              {!storyboardActive && !completedShots && (
                <button
                  onClick={generateAllFrames}
                  disabled={!kieApiKey || storyboardActive}
                  className="bg-primary text-primary-foreground font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all disabled:opacity-40 hover:shadow-[0_8px_30px_-6px_hsl(var(--primary)/0.3)] hover:-translate-y-0.5 text-[11px]"
                >
                  <Film className="h-3.5 w-3.5" /> Generate all frames
                </button>
              )}
            </div>
          </div>

          {/* Prompt cards — vertical list */}
          <div className="space-y-3">
            {generatedPrompts.map((promptText, i) => {
              const beat = currentBeats[i];
              const shot = shotStatuses[i];
              const isGeneratingFrame = shot?.state === "generating";
              const isCompleted = shot?.state === "completed";
              const isFailed = shot?.state === "failed";

              // Left bar color
              const leftBarColor = isFailed
                ? "bg-red-500"
                : isCompleted
                  ? "bg-emerald-500"
                  : isGeneratingFrame
                    ? "bg-primary"
                    : (() => {
                        const roleColors: Record<string, string> = {
                          hook: "bg-amber-500",
                          problem: "bg-rose-500",
                          demo: "bg-blue-500",
                          "social-proof": "bg-violet-500",
                          result: "bg-emerald-500",
                          cta: "bg-cyan-500",
                          before: "bg-orange-500",
                          after: "bg-green-500",
                          benefit: "bg-sky-500",
                          lifestyle: "bg-pink-500",
                        };
                        return roleColors[beat?.storyRole || ""] || "bg-muted-foreground/20";
                      })();

              return (
                <div
                  key={i}
                  className="flex overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] transition-all"
                >
                  {/* Colored left bar */}
                  <div className={`w-[3px] shrink-0 rounded-l-xl ${leftBarColor}`} />

                  <div className="flex-1 p-3">
                    {/* Header: badge + status pill */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground/30">#{i + 1}</span>
                        {beat && (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${getStoryRoleColor(beat.storyRole, i)}`}
                          >
                            {beat.storyRole}
                          </span>
                        )}
                        <span className="text-[10px] text-foreground font-medium">
                          {beat?.label || `Frame ${i + 1}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isCompleted && (
                          <span className="bg-emerald-500/10 text-emerald-400 rounded-md px-2 py-0.5 text-[10px] font-medium">
                            Done
                          </span>
                        )}
                        {isFailed && (
                          <span className="bg-red-500/10 text-red-400 rounded-md px-2 py-0.5 text-[10px] font-medium">
                            Failed
                          </span>
                        )}
                        {isGeneratingFrame && (
                          <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 text-[10px] font-medium flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Generating
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content row: thumbnail + textarea */}
                    <div className="flex gap-3">
                      {/* Completed image thumbnail on left */}
                      {isCompleted && shot.imageUrl && (
                        <div className="shrink-0">
                          <img
                            src={shot.imageUrl}
                            alt={beat?.label}
                            className="h-16 w-12 rounded-lg object-cover border border-white/[0.06]"
                          />
                          <a
                            href={shot.imageUrl}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[8px] text-primary hover:underline flex items-center gap-0.5 mt-1 justify-center"
                          >
                            <Download className="h-2.5 w-2.5" /> Save
                          </a>
                        </div>
                      )}

                      {/* Editable prompt textarea */}
                      <div className="flex-1">
                        <Textarea
                          value={promptText}
                          onChange={(e) => updatePromptText(i, e.target.value)}
                          disabled={isGeneratingFrame || storyboardActive}
                          className="text-[11px] min-h-[60px] bg-background/30 border-white/[0.04] resize-y"
                          rows={3}
                        />
                      </div>
                    </div>

                    {/* Per-frame generate button */}
                    {!isGeneratingFrame && !storyboardActive && (
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => generateSingleFrame(i)}
                          disabled={!kieApiKey || isGeneratingFrame}
                          className={`text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-40 ${
                            isCompleted
                              ? "bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08]"
                              : "bg-primary text-primary-foreground hover:bg-primary/90"
                          }`}
                        >
                          {isCompleted ? <RefreshCw className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                          {isCompleted ? "Regenerate" : "Generate frame"}
                        </button>
                        {isFailed && shot.error && <span className="text-[9px] text-red-400">{shot.error}</span>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions when at least 1 frame is completed */}
          {completedShots > 0 && !storyboardActive && !promptsLoading && (
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  const storyboardImgs = shotStatuses
                    .filter((s) => s.state === "completed" && s.imageUrl)
                    .map((s) => s.imageUrl!);
                  navigate("/video", {
                    state: {
                      fromStoryboard: true,
                      template: storyboardTemplate,
                      storyboardImages: storyboardImgs,
                      sourceImage: storyboardImgs[0] || null,
                      baseImageUrl: storyboardImgs[0] || null,
                      productDNA: productDNA || null,
                      productCategory: productDNA?.category || "other",
                      characterId: selectedChar?.id?.startsWith("p") ? null : selectedChar?.id || null,
                      characterIdentity: selectedChar?.identity_prompt || selectedChar?.description || null,
                    },
                  });
                }}
                className="w-full bg-primary text-primary-foreground font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-[0_8px_30px_-6px_hsl(var(--primary)/0.3)] hover:-translate-y-0.5"
              >
                <Play className="h-3.5 w-3.5" />
                {`Continue to Video · ${completedShots} frame${completedShots > 1 ? "s" : ""}`}{" "}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
              {totalShots - completedShots > 0 && (
                <p className="text-[11px] text-muted-foreground/30 text-center">
                  {totalShots - completedShots} frame{totalShots - completedShots > 1 ? "s" : ""} skipped — you can
                  generate them later
                </p>
              )}
              <button
                onClick={generateAllFrames}
                disabled={!kieApiKey}
                className="w-full border border-white/[0.06] text-foreground font-semibold text-xs py-2 rounded-xl hover:bg-accent transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <Film className="h-3 w-3" /> Generate All Frames
              </button>
              <button
                onClick={resetStoryboard}
                className="w-full text-muted-foreground text-xs py-2 rounded-xl hover:text-foreground transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-3 w-3" /> Reset
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default StoryboardPanel;
