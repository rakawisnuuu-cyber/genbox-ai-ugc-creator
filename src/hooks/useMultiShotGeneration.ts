import { useState, useRef, useCallback } from "react";
import type { VideoModule } from "@/lib/video-modules";

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

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${promptModel}:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{
                text: `You are an expert TikTok video prompt engineer. Enhance this video prompt for AI generation.

Rules:
- Output MUST be in English
- Focus on MOTION, ACTION, CAMERA MOVEMENT
- Keep under 80 words
- Include audio/dialogue direction naturally in the prompt
- NO brackets, NO placeholders, NO template markers
- Output ONLY the final prompt text

Context: Shot #${shotIndex + 1} of ${modules.length}. Duration: ${mod.duration}s. Module type: ${mod.type}.${dialogueSection}`,
              }],
            },
            contents: [{ parts: [{ text: mod.prompt }] }],
          }),
        }
      );
      const json = await res.json();
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
    // Build image inputs
    const imageInputs: string[] = [];
    if (mod.source === "character" && characterHeroUrl) imageInputs.push(characterHeroUrl);
    if (characterRefUrl) imageInputs.push(characterRefUrl);
    if (mod.source === "product" && productImageUrl) imageInputs.push(productImageUrl);
    else if (productImageUrl && mod.source === "character") imageInputs.push(productImageUrl);
    // Add previous shot's last frame for continuity
    if (shotIndex > 0 && lastFrameRef.current) imageInputs.push(lastFrameRef.current);

    const uniqueImages = [...new Set(imageInputs.filter(Boolean))];

    let taskId: string;
    let pollUrl: string;
    let pollInterval: number;

    if (model === "grok") {
      const createRes = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
        method: "POST",
        headers: { Authorization: `Bearer ${kieApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "grok-imagine/image-to-video",
          input: {
            image_urls: uniqueImages.length > 0 ? uniqueImages : undefined,
            prompt: enhancedPrompt,
            mode: "normal",
            duration: String(Math.min(mod.duration, 8)),
            resolution: "480p",
          },
        }),
      });
      const createJson = await createRes.json();
      if (createJson.code !== 200 || !createJson.data?.taskId) {
        throw new Error(createJson.message || "Failed to create Grok task");
      }
      taskId = createJson.data.taskId;
      pollUrl = `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`;
      pollInterval = 3000;
    } else {
      const veoModel = model === "veo_fast" ? "veo3_fast" : "veo3";
      const createRes = await fetch("https://api.kie.ai/api/v1/veo/generate", {
        method: "POST",
        headers: { Authorization: `Bearer ${kieApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          imageUrls: uniqueImages.length > 0 ? uniqueImages : undefined,
          model: veoModel,
          aspect_ratio: aspectRatio,
          generationType: "FIRST_AND_LAST_FRAMES_2_VIDEO",
          enableTranslation: true,
        }),
      });
      const createJson = await createRes.json();
      taskId = createJson.data?.taskId || createJson.taskId;
      if (!taskId) throw new Error(createJson.message || "Failed to create Veo task");
      pollUrl = `https://api.kie.ai/api/v1/veo/detail?taskId=${taskId}`;
      pollInterval = 5000;
    }

    // Poll
    let polls = 0;
    const maxPolls = 60;
    const poll = async (): Promise<string> => {
      if (cancelRef.current) throw new Error("Cancelled");
      const r = await fetch(pollUrl, { headers: { Authorization: `Bearer ${kieApiKey}` } });
      const j = await r.json();

      if (model === "grok") {
        const state = j.data?.state;
        if (state === "success") {
          const resultJson = typeof j.data.resultJson === "string" ? JSON.parse(j.data.resultJson) : j.data.resultJson;
          const url = resultJson?.resultUrls?.[0] || resultJson?.videoUrl || resultJson?.video_url || resultJson?.url || "";
          if (!url) throw new Error("No video URL in Grok result");
          return url;
        }
        if (state === "fail") throw new Error("Grok generation failed");
      } else {
        const status = j.data?.status || j.status;
        if (status === "SUCCESS" || status === "success" || status === "completed") {
          const url = j.data?.videoUrl || j.data?.video_url || j.videoUrl || "";
          if (!url) throw new Error("No video URL in Veo result");
          return url;
        }
        if (status === "FAILED" || status === "fail" || status === "failed") throw new Error("Veo generation failed");
      }

      polls++;
      if (polls >= maxPolls) throw new Error("Timeout — generation took too long");
      await new Promise((r) => setTimeout(r, pollInterval));
      return poll();
    };

    return await poll();
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
        lastFrameRef.current = videoUrl; // Use as reference for next shot

        setProgress((p) => ({
          ...p,
          completedShots: [...p.completedShots, i],
        }));
      } catch (err: any) {
        stopShotTimer();
        if (cancelRef.current) break;
        console.error(`Shot ${i + 1} failed:`, err);
        onModuleUpdate(i, { status: "failed" });
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
      console.error(`Retry shot ${shotIdx + 1} failed:`, err);
      onModuleUpdate(shotIdx, { status: "failed" });
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
