import { useState, useEffect, useRef } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

/* ── Stage timings per model (ms) ─────────────────────── */
const STAGE_TIMINGS: Record<string, number[]> = {
  grok: [2000, 4000, 15000, 17000],
  veo_fast: [3000, 6000, 25000, 30000],
  veo_quality: [5000, 10000, 110000, 120000],
  image: [2000, 15000, 18000],
};

interface Stage {
  label: string;
  sublabel: string;
}

const VIDEO_STAGES: Stage[] = [
  { label: "Menganalisis...", sublabel: "Scanning source image" },
  { label: "Membangun prompt...", sublabel: "AI merancang scene optimal" },
  { label: "Generating video...", sublabel: "Membuat video dengan AI" },
  { label: "Memproses...", sublabel: "Finalizing output" },
];

const IMAGE_STAGES: Stage[] = [
  { label: "Menganalisis prompt...", sublabel: "Memproses instruksi" },
  { label: "Generating gambar...", sublabel: "Membuat gambar dengan AI" },
  { label: "Selesai!", sublabel: "Gambar siap" },
];

function formatElapsed(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `00:${String(sec).padStart(2, "0")}`;
}

/* ── Animated prompt text ─────────────────────────────── */
function TypewriterText({ text }: { text: string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (shown >= text.length) return;
    const t = setTimeout(() => setShown((p) => p + 1), 18);
    return () => clearTimeout(t);
  }, [shown, text.length]);
  return (
    <span className="font-mono text-[11px] text-muted-foreground/70 break-all">
      {text.slice(0, shown)}
      <span className="animate-pulse text-primary">▊</span>
    </span>
  );
}

/* ── Checkmark animation ──────────────────────────────── */
function AnimatedCheck() {
  return (
    <div className="relative h-16 w-16">
      <svg viewBox="0 0 64 64" className="h-full w-full">
        <circle
          cx="32" cy="32" r="28" fill="none"
          stroke="hsl(var(--primary))" strokeWidth="3"
          strokeDasharray="176" strokeDashoffset="176"
          className="animate-[draw-circle_0.5s_ease-out_forwards]"
        />
        <path
          d="M20 33 L28 41 L44 25" fill="none"
          stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray="40" strokeDashoffset="40"
          className="animate-[draw-check_0.3s_ease-out_0.4s_forwards]"
        />
      </svg>
    </div>
  );
}

/* ── Main loading component ───────────────────────────── */
interface GenerationLoadingProps {
  model: string; // "grok" | "veo_fast" | "veo_quality" | "image"
  elapsed: number; // seconds
  aspectRatio?: string;
  prompt?: string;
  modelLabel?: string;
  badgeColor?: string;
  isComplete?: boolean;
  onCancel?: () => void;
}

export default function GenerationLoading({
  model,
  elapsed,
  aspectRatio = "9:16",
  prompt = "",
  modelLabel,
  badgeColor,
  isComplete,
  onCancel,
}: GenerationLoadingProps) {
  const isVideo = model !== "image";
  const stages = isVideo ? VIDEO_STAGES : IMAGE_STAGES;
  const timings = STAGE_TIMINGS[model] || STAGE_TIMINGS.image;
  const elapsedMs = elapsed * 1000;

  // Determine current stage
  let currentStage = 0;
  if (isComplete) {
    currentStage = stages.length - 1;
  } else {
    for (let i = timings.length - 1; i >= 0; i--) {
      if (elapsedMs >= timings[i]) {
        currentStage = Math.min(i + 1, stages.length - 1);
        break;
      }
      if (i === 0 && elapsedMs < timings[0]) {
        currentStage = 0;
      }
    }
    // Clamp
    if (elapsedMs >= timings[0] && elapsedMs < (timings[1] || Infinity)) currentStage = 1;
    if (elapsedMs >= (timings[1] || Infinity) && elapsedMs < (timings[timings.length - 2] || Infinity)) currentStage = isVideo ? 2 : 1;
    if (elapsedMs >= (timings[timings.length - 2] || Infinity)) currentStage = stages.length - 1;
    if (elapsedMs < timings[0]) currentStage = 0;
  }

  // Progress percentage (approximate)
  const totalTime = timings[timings.length - 1];
  const progress = isComplete ? 100 : Math.min(95, (elapsedMs / totalTime) * 100);

  const stage = stages[currentStage];
  const isAnalyzing = currentStage === 0;
  const isPromptBuilding = currentStage === 1 && isVideo;
  const isGenerating = isVideo ? currentStage === 2 : currentStage === 1;
  const isFinalizing = currentStage === stages.length - 1;

  const aspect = aspectRatio === "16:9" ? "aspect-[16/9]" : aspectRatio === "1:1" ? "aspect-square" : "aspect-[9/16]";

  return (
    <div className="flex flex-col items-center text-center gap-4 w-full max-w-xs animate-fade-in">
      {/* Main visual area */}
      <div className={`${aspect} w-full rounded-xl overflow-hidden relative border border-border`}>
        {/* Background gradient mesh */}
        <div className="absolute inset-0 generation-mesh" />

        {/* Scanning line for stage 1 */}
        {isAnalyzing && !isComplete && (
          <div className="absolute inset-0">
            <div className="absolute left-0 right-0 h-[2px] bg-primary/60 shadow-[0_0_8px_hsl(var(--primary)/0.4)] animate-[scan-line_2s_ease-in-out_infinite]" />
          </div>
        )}

        {/* Prompt typewriter for stage 2 (video) */}
        {isPromptBuilding && prompt && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-background/80 backdrop-blur-sm rounded-lg p-3 max-h-full overflow-hidden">
              <TypewriterText text={prompt.slice(0, 120)} />
            </div>
          </div>
        )}

        {/* Timer overlay for generating stage */}
        {(isGenerating || (isPromptBuilding && !isVideo)) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <p className="font-mono text-3xl font-bold text-foreground/80 tabular-nums">
              {formatElapsed(elapsed)}
            </p>
            {modelLabel && (
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full animate-pulse ${badgeColor || "bg-primary/20 text-primary"}`}>
                {modelLabel}
              </span>
            )}
          </div>
        )}

        {/* Checkmark for final stage */}
        {(isFinalizing || isComplete) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <AnimatedCheck />
          </div>
        )}
      </div>

      {/* Stage info */}
      <div className="space-y-1">
        <div className="flex items-center justify-center gap-2">
          {!isFinalizing && !isComplete && (
            <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
          )}
          <p className="text-sm text-foreground font-medium">{stage.label}</p>
        </div>
        <p className="text-xs text-muted-foreground/60">{stage.sublabel}</p>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Stage dots */}
      <div className="flex items-center gap-2">
        {stages.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              i < currentStage ? "bg-primary" :
              i === currentStage ? "bg-primary animate-pulse" :
              "bg-muted-foreground/20"
            }`} />
            {i < stages.length - 1 && (
              <div className={`w-6 h-[1px] transition-colors duration-300 ${i < currentStage ? "bg-primary/50" : "bg-muted-foreground/10"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Cancel */}
      {onCancel && !isComplete && (
        <button onClick={onCancel} className="text-xs text-destructive hover:underline">Batal</button>
      )}
    </div>
  );
}

/* ── Character grid slot loading ──────────────────────── */
export function CharacterSlotLoading({ isGenerating, isComplete }: { isGenerating: boolean; isComplete: boolean }) {
  if (isComplete) return null;
  if (!isGenerating) return null;
  return (
    <div className="absolute inset-0 generation-mesh rounded-xl">
      <div className="absolute inset-0 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary/60 animate-spin" />
      </div>
    </div>
  );
}

/* ── Count-up animation hook ──────────────────────────── */
export function useCountUp(target: number, duration = 800, enabled = true) {
  const [value, setValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const animFrame = useRef<number>(0);

  useEffect(() => {
    if (!enabled || target === 0) {
      setValue(target);
      return;
    }
    startTime.current = Date.now();
    const animate = () => {
      const elapsed = Date.now() - (startTime.current || 0);
      const progress = Math.min(elapsed / duration, 1);
      // ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        animFrame.current = requestAnimationFrame(animate);
      }
    };
    animFrame.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame.current);
  }, [target, duration, enabled]);

  return value;
}
