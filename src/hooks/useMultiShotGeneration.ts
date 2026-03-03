import { useState, useRef, useCallback } from "react";
import type { VideoModule } from "@/lib/video-modules";
import { generateVideoAndWait, normalizeDurationForModel } from "@/lib/kie-video-generation";
import { geminiFetch } from "@/lib/gemini-fetch";
interface UseMultiShotGenerationOptions {
  projectId: string;
  modules: VideoModule[];
  characterHeroUrl: string | null;
  characterRefUrl: string | null;
  productImageUrl: string | null;
  model: string; // "grok" | "veo_fast" | "veo_quality"
  aspectRatio: string;
  kieApiKey: string;
  geminiApiKey: string;
  promptModel: string;
  onModuleUpdate: (idx: number, patch: Partial<VideoModule>) => void;
  onProjectStatusChange: (status: string) => void;
}

interface ShotProgress {
  currentShot: number;
  totalShots: number;
  completedShots: number[];
  failedShots: number[];
  elapsedPerShot: Record<number, number>;
  totalElapsed: number;
  status: "idle" | "generating" | "paused" | "completed" | "cancelled";
}

const COST_PER_SHOT: Record<string, number> = {
  grok: 1600,
  veo_fast: 4800,
  veo_quality: 19200,
};

export function useMultiShotGeneration(options: UseMultiShotGenerationOptions) {
  const {
    projectId,
    modules,
    characterHeroUrl,
    characterRefUrl,
    productImageUrl,
    model,
    aspectRatio,
    kieApiKey,
    geminiApiKey,
    promptModel,
    onModuleUpdate,
    onProjectStatusChange,
  } = options;

  const [progress, setProgress] = useState<ShotProgress>({
    currentShot: -1,
    totalShots: modules.length,
    completedShots: [],
    failedShots: [],
    elapsedPerShot: {},
    totalElapsed: 0,
    status: "idle",
  });

  const pauseRef = useRef(false);
  const cancelRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const shotTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastFrameRef = useRef<string | null>(null);

  const startGlobalTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setProgress((p) => ({ ...p, totalElapsed: p.totalElapsed + 1 }));
    }, 1000);
  }, []);

  const stopGlobalTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const startShotTimer = useCallback((shotIdx: number) => {
    shotTimerRef.current = setInterval(() => {
      setProgress((p) => ({
        ...p,
        elapsedPerShot: {
          ...p.elapsedPerShot,
          [shotIdx]: (p.elapsedPerShot[shotIdx] || 0) + 1,
        },
      }));
    }, 1000);
  }, []);

  const stopShotTimer = useCallback(() => {
    if (shotTimerRef.current) clearInterval(shotTimerRef.current);
    shotTimerRef.current = null;
  }, []);

  // Enhance prompt via Gemini before sending to API
  const enhanceModulePrompt = async (mod: VideoModule, shotIndex: number): Promise<string> => {
    if (!geminiApiKey) return mod.prompt;
    try {
      const dialogueSection = mod.withDialogue && mod.dialogueText
        ? `\n\nInclude natural spoken dialogue: "${mod.dialogueText}"\nAudio direction: ${mod.audioDirection || "natural ambient"}`
        : `\nNo dialogue. Audio: ${mod.audioDirection || "ambient sounds only"}`;

      const json = await geminiFetch(promptModel, geminiApiKey, {
        systemInstruction: {
          parts: [{
            text: `You are an expert TikTok video prompt engineer. Enhance this video prompt for AI generation.

Rules:
- Output MUST be in English
- Focus on MOTION, ACTION, CAMERA MOVEMENT
- Keep under 80 words
- Include audio/dialogue direction naturally in the prompt
- NO brackets, NO placeholders, NO template markers
- IMPORTANT: Maintain visual consistency — the person should wear the SAME outfit, have the SAME appearance across all shots
- Output ONLY the final prompt text

Context: Shot #${shotIndex + 1} of ${modules.length}. Duration: ${mod.duration}s. Module type: ${mod.type}.
${shotIndex > 0 ? `Previous shot was: ${modules[shotIndex - 1]?.prompt?.substring(0, 100) || 'N/A'}` : ''}${dialogueSection}`,
          }],
        },
        contents: [{ parts: [{ text: mod.prompt }] }],
      });
      return json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || mod.prompt;
    } catch {
      return mod.prompt;
    }
  };

  // Generate a single shot via Kie AI
  const generateSingleShot = async (
    mod: VideoModule,
    shotIndex: number,
    enhancedPrompt: string
  ): Promise<string> => {
    // Build image inputs — only use actual IMAGE URLs, never video URLs
    const imageInputs: string[] = [];
    // Always include character hero image for visual consistency
    if (characterHeroUrl) imageInputs.push(characterHeroUrl);
    // Always include product image if available
    if (productImageUrl) imageInputs.push(productImageUrl);
    // For custom source modules with uploaded images
    if (mod.source === "custom" && mod.customImageUrl) imageInputs.push(mod.customImageUrl);
    // NOTE: We do NOT add lastFrameRef (previous video URL) because
    // Grok/Veo image_urls only accepts image files (JPEG/PNG/WebP), not .mp4

    const uniqueImages = [...new Set(imageInputs.filter(Boolean))];

    console.log(`=== MULTI-SHOT: Generating shot ${shotIndex + 1} ===`);
    console.log("Model:", model, "Duration:", mod.duration, "→", normalizeDurationForModel(model, mod.duration));
    console.log("Images:", uniqueImages.length);

    const result = await generateVideoAndWait(
      {
        model: model as "grok" | "veo_fast" | "veo_quality",
        prompt: enhancedPrompt,
        imageUrls: uniqueImages,
        duration: mod.duration,
        aspectRatio,
        apiKey: kieApiKey,
      },
      () => cancelRef.current,
    );

    return result.videoUrl;
  };

  // Main generation loop
  const start = useCallback(async () => {
    cancelRef.current = false;
    pauseRef.current = false;
    lastFrameRef.current = null;

    setProgress({
      currentShot: 0,
      totalShots: modules.length,
      completedShots: [],
      failedShots: [],
      elapsedPerShot: {},
      totalElapsed: 0,
      status: "generating",
    });

    onProjectStatusChange("generating");
    startGlobalTimer();

    for (let i = 0; i < modules.length; i++) {
      if (cancelRef.current) break;

      // Wait if paused
      while (pauseRef.current && !cancelRef.current) {
        await new Promise((r) => setTimeout(r, 500));
      }
      if (cancelRef.current) break;

      const mod = modules[i];
      setProgress((p) => ({ ...p, currentShot: i }));
      onModuleUpdate(i, { status: "generating" });
      startShotTimer(i);

      try {
        // Enhance prompt
        const enhancedPrompt = await enhanceModulePrompt(mod, i);
        onModuleUpdate(i, { prompt: enhancedPrompt });

        // Generate
        const videoUrl = await generateSingleShot(mod, i, enhancedPrompt);
        stopShotTimer();

        onModuleUpdate(i, { status: "completed", video_url: videoUrl });

        setProgress((p) => ({
          ...p,
          completedShots: [...p.completedShots, i],
        }));
      } catch (err: any) {
        stopShotTimer();
        if (cancelRef.current) break;
        const errorMsg = err?.message || "Unknown error";
        console.error(`Shot ${i + 1} failed:`, errorMsg);
        onModuleUpdate(i, { status: "failed", error_message: errorMsg });
        setProgress((p) => ({
          ...p,
          failedShots: [...p.failedShots, i],
        }));
        // Continue to next shot even on failure
      }
    }

    stopGlobalTimer();

    if (cancelRef.current) {
      setProgress((p) => ({ ...p, status: "cancelled" }));
      onProjectStatusChange("draft");
    } else {
      const finalCompleted = modules.every(
        (_, i) => modules[i]?.status === "completed" || progress.completedShots.includes(i)
      );
      setProgress((p) => ({ ...p, status: "completed" }));
      onProjectStatusChange(finalCompleted ? "completed" : "completed");
    }
  }, [modules, model, aspectRatio, kieApiKey, geminiApiKey, promptModel, characterHeroUrl, characterRefUrl, productImageUrl]);

  const pause = useCallback(() => {
    pauseRef.current = true;
    setProgress((p) => ({ ...p, status: "paused" }));
  }, []);

  const resume = useCallback(() => {
    pauseRef.current = false;
    setProgress((p) => ({ ...p, status: "generating" }));
  }, []);

  const cancel = useCallback(() => {
    cancelRef.current = true;
    pauseRef.current = false;
    stopGlobalTimer();
    stopShotTimer();
    setProgress((p) => ({ ...p, status: "cancelled" }));
    onProjectStatusChange("draft");
  }, []);

  const retryShot = useCallback(async (shotIdx: number) => {
    const mod = modules[shotIdx];
    if (!mod) return;

    onModuleUpdate(shotIdx, { status: "generating" });
    startShotTimer(shotIdx);

    try {
      const enhancedPrompt = await enhanceModulePrompt(mod, shotIdx);
      onModuleUpdate(shotIdx, { prompt: enhancedPrompt });
      const videoUrl = await generateSingleShot(mod, shotIdx, enhancedPrompt);
      stopShotTimer();
      onModuleUpdate(shotIdx, { status: "completed", video_url: videoUrl });
      setProgress((p) => ({
        ...p,
        completedShots: [...p.completedShots.filter((s) => s !== shotIdx), shotIdx],
        failedShots: p.failedShots.filter((s) => s !== shotIdx),
      }));
    } catch (err: any) {
      stopShotTimer();
      const errorMsg = err?.message || "Unknown error";
      console.error(`Retry shot ${shotIdx + 1} failed:`, errorMsg);
      onModuleUpdate(shotIdx, { status: "failed", error_message: errorMsg });
    }
  }, [modules]);

  return {
    start,
    pause,
    resume,
    cancel,
    retryShot,
    progress,
    costPerShot: COST_PER_SHOT[model] || 4800,
    totalCost: modules.length * (COST_PER_SHOT[model] || 4800),
  };
}
