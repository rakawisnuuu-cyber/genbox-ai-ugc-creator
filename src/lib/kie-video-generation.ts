/**
 * Shared Kie AI video generation client.
 * Single source of truth for task creation, polling, and result parsing.
 * Used by both quick-mode (VideoPage) and multi-shot (useMultiShotGeneration).
 */

const KIE_BASE = "https://api.kie.ai/api/v1";

// ── Model type ──────────────────────────────────────────────────────
export type VideoModel = "grok" | "veo_fast" | "veo_quality" | "kling_std" | "kling_pro" | "sora2" | "sora2_pro";

// ── Duration normalization ──────────────────────────────────────────
export function normalizeDurationForModel(model: string, duration: number): number {
  if (model === "grok") return duration < 8 ? 6 : 10;
  if (model === "kling_std" || model === "kling_pro") {
    return Math.max(3, Math.min(15, duration));
  }
  return duration; // Veo: fixed 8s
}

// ── Types ───────────────────────────────────────────────────────────
export interface CreateVideoParams {
  model: VideoModel;
  prompt: string;
  imageUrls: string[];
  duration?: number;
  aspectRatio?: string;
  apiKey: string;
}

export interface VideoResult {
  videoUrl: string;
  taskId: string;
}

// ── Timeouts & retry config ─────────────────────────────────────────
const POLL_TIMEOUT: Record<string, number> = {
  grok: 180_000,
  veo_fast: 300_000,
  veo_quality: 600_000,
  kling_std: 300_000,
  kling_pro: 600_000,
  sora2: 300_000,
  sora2_pro: 600_000,
};

const POLL_INTERVAL: Record<string, number> = {
  grok: 3_000,
  veo_fast: 5_000,
  veo_quality: 5_000,
  kling_std: 5_000,
  kling_pro: 5_000,
  sora2: 5_000,
  sora2_pro: 5_000,
};

const MAX_404_RETRIES = 5;

// ── Error helper ────────────────────────────────────────────────────
function extractError(json: any, fallback: string): string {
  return json?.errorMessage || json?.msg || json?.message || json?.error || fallback;
}

// ── Task creation ───────────────────────────────────────────────────
async function createTask(params: CreateVideoParams): Promise<{ taskId: string; model: string }> {
  const { model, prompt, imageUrls, duration = 6, aspectRatio = "9:16", apiKey } = params;
  const headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };

  // Veo safety prefix
  const isVeo = model === "veo_fast" || model === "veo_quality";
  const safePrompt = isVeo
    ? "Casual product review video by a content creator for social media. Natural observational tone. " + prompt
    : prompt;

  // ── Grok ──
  if (model === "grok") {
    const normalizedDuration = normalizeDurationForModel("grok", duration);
    

    const res = await fetch(`${KIE_BASE}/jobs/createTask`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "grok-imagine/image-to-video",
        input: {
          image_urls: imageUrls.length > 0 ? imageUrls : undefined,
          prompt,
          mode: "normal",
          duration: String(normalizedDuration),
          resolution: "480p",
        },
      }),
    });

    const json = await res.json();
    

    if (json.code !== 200 || !json.data?.taskId) {
      throw new Error(extractError(json, "Failed to create Grok task"));
    }
    return { taskId: json.data.taskId, model };
  }

  // ── Kling 3.0 ──
  if (model === "kling_std" || model === "kling_pro") {
    const normalizedDuration = normalizeDurationForModel(model, duration);
    const klingMode = model === "kling_pro" ? "pro" : "std";
    

    const res = await fetch(`${KIE_BASE}/jobs/createTask`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "kling-3.0/video",
        input: {
          prompt,
          image_urls: imageUrls.length > 0 ? imageUrls : undefined,
          duration: String(normalizedDuration),
          aspect_ratio: aspectRatio,
          mode: klingMode,
          sound: true,
          multi_shots: false,
        },
      }),
    });

    const json = await res.json();
    
    if (json.code !== 200 || !json.data?.taskId) {
      throw new Error(extractError(json, "Failed to create Kling task"));
    }
    return { taskId: json.data.taskId, model };
  }

  // ── Sora 2 ──
  if (model === "sora2" || model === "sora2_pro") {
    const soraModel = model === "sora2" ? "sora-2-image-to-video" : "sora-2-pro-image-to-video";
    const soraAspect = aspectRatio === "9:16" ? "portrait" : aspectRatio === "16:9" ? "landscape" : "square";
    

    const res = await fetch(`${KIE_BASE}/jobs/createTask`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: soraModel,
        input: {
          prompt,
          image_urls: imageUrls.length > 0 ? imageUrls : undefined,
          aspect_ratio: soraAspect,
          n_frames: "10",
          remove_watermark: true,
          upload_method: "s3",
        },
      }),
    });

    const json = await res.json();
    
    if (json.code !== 200 || !json.data?.taskId) {
      throw new Error(extractError(json, "Failed to create Sora 2 task"));
    }
    return { taskId: json.data.taskId, model };
  }

  // ── Veo Fast / Quality ──
  const veoModel = model === "veo_fast" ? "veo3_fast" : "veo3";
  

  const imageCount = imageUrls.filter(Boolean).length;
  let generationType = "TEXT_2_VIDEO";
  if (imageCount >= 1) {
    generationType = "FIRST_AND_LAST_FRAMES_2_VIDEO";
  }
  console.log(`[kie] Veo generationType: ${generationType} (${imageCount} images, model=${model})`);

  const res = await fetch(`${KIE_BASE}/veo/generate`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      prompt: safePrompt,
      imageUrls: imageCount > 0 ? imageUrls : undefined,
      model: veoModel,
      aspect_ratio: aspectRatio,
      generationType,
      enableTranslation: true,
    }),
  });

  const json = await res.json();
  console.log("[kie] Veo create response:", json);

  const taskId = json.data?.taskId || json.taskId;
  if (!taskId) {
    throw new Error(extractError(json, "Failed to create Veo task"));
  }
  return { taskId, model };
}

// ── Polling ─────────────────────────────────────────────────────────
async function pollTask(taskId: string, model: string, apiKey: string, isCancelled?: () => boolean): Promise<string> {
  const pollUrl =
    model === "veo_fast" || model === "veo_quality"
      ? `${KIE_BASE}/veo/record-info?taskId=${taskId}`
      : `${KIE_BASE}/jobs/recordInfo?taskId=${taskId}`;

  const timeout = POLL_TIMEOUT[model] || 300_000;
  const interval = POLL_INTERVAL[model] || 5_000;
  const startTime = Date.now();
  let consecutive404s = 0;

  console.log(`[kie] Polling started. Model=${model}, taskId=${taskId}, url=${pollUrl}`);

  const isVeoModel = model === "veo_fast" || model === "veo_quality";

  const doPoll = async (): Promise<string> => {
    if (isCancelled?.()) throw new Error("Cancelled");
    if (Date.now() - startTime > timeout) {
      throw new Error(`Timeout — generation took too long (${Math.round(timeout / 1000)}s)`);
    }

    const r = await fetch(pollUrl, { headers: { Authorization: `Bearer ${apiKey}` } });

    if (r.status === 404) {
      consecutive404s++;
      console.warn(`[kie] Poll 404 (${consecutive404s}/${MAX_404_RETRIES}). URL: ${pollUrl}`);
      if (consecutive404s >= MAX_404_RETRIES) {
        throw new Error("Task not found after multiple retries — task creation may have failed");
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
      return doPoll();
    }
    consecutive404s = 0;

    const j = await r.json();
    console.log(`[kie] Poll response (${model}):`, j);

    if (!isVeoModel) {
      // Grok & Kling use same response format
      const state = j.data?.state;
      if (state === "success") {
        const resultJson = typeof j.data.resultJson === "string" ? JSON.parse(j.data.resultJson) : j.data.resultJson;
        const url =
          resultJson?.resultUrls?.[0] || resultJson?.videoUrl || resultJson?.video_url || resultJson?.url || "";
        if (!url) throw new Error("No video URL in result");
        return url;
      }
      if (state === "fail") throw new Error(extractError(j.data, `${model} generation failed`));
    } else {
      // Veo
      const flag = j.data?.successFlag;
      if (flag === 1) {
        const responseData =
          typeof j.data?.response === "string"
            ? (() => {
                try {
                  return JSON.parse(j.data.response);
                } catch {
                  return null;
                }
              })()
            : j.data?.response;

        let url =
          j.data?.videoUrl ||
          j.data?.resultUrl ||
          j.data?.video_url ||
          responseData?.videoUrl ||
          responseData?.resultUrl ||
          responseData?.video_url ||
          responseData?.resultUrls?.[0] ||
          responseData?.url ||
          "";

        if (!url && j.data?.resultJson) {
          const rj = typeof j.data.resultJson === "string" ? JSON.parse(j.data.resultJson) : j.data.resultJson;
          url = rj?.videoUrl || rj?.resultUrls?.[0] || rj?.video_url || rj?.url || "";
        }

        if (!url && j.data?.output) {
          const out = typeof j.data.output === "string" ? JSON.parse(j.data.output) : j.data.output;
          url = out?.videoUrl || out?.video_url || out?.url || out?.resultUrls?.[0] || "";
        }

        console.log("[kie] Veo success. Extracted URL:", url, "Full data:", JSON.stringify(j.data));
        if (!url) throw new Error("No video URL in Veo result. Raw: " + JSON.stringify(j.data).slice(0, 300));
        return url;
      }
      if (flag === 2 || flag === 3) {
        const msg = extractError(j.data, "Veo generation failed");
        const fullResponse = JSON.stringify(j.data).slice(0, 1000);
        const isSafetyBlock = /safety review|safety|blocked|policy|harmful|halted/i.test(msg + fullResponse);
        if (isSafetyBlock) {
          throw new Error(
            "SAFETY_BLOCKED: Google safety filter blocked this. Try simplifying the prompt or switch to Kling model.",
          );
        }
        throw new Error(msg);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, interval));
    return doPoll();
  };

  return doPoll();
}

// ── Public API ──────────────────────────────────────────────────────
export async function generateVideoAndWait(
  params: CreateVideoParams,
  isCancelled?: () => boolean,
): Promise<VideoResult> {
  const { taskId, model } = await createTask(params);
  const videoUrl = await pollTask(taskId, model, params.apiKey, isCancelled);
  return { videoUrl, taskId };
}

// ── HD Video Upgrade (Veo only) ─────────────────────────────────
export async function fetchHDVideo(
  taskId: string,
  apiKey: string,
  resolution: "1080p" | "4k",
  isCancelled?: () => boolean,
): Promise<string> {
  const headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };

  if (resolution === "1080p") {
    const url = `${KIE_BASE}/veo/get-1080p-video?taskId=${taskId}&index=0`;
    const timeout = 180_000; // 3 min
    const interval = 20_000; // 20s
    const startTime = Date.now();

    const poll = async (): Promise<string> => {
      if (isCancelled?.()) throw new Error("Cancelled");
      if (Date.now() - startTime > timeout) throw new Error("1080p upgrade timed out");

      const r = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
      const j = await r.json();
      console.log("[kie] 1080p poll:", j);

      if (j.code === 200 && j.data?.resultUrl) {
        return j.data.resultUrl;
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
      return poll();
    };

    return poll();
  }

  // 4K — initiate then poll
  console.log("[kie] Requesting 4K upgrade for taskId:", taskId);
  const initRes = await fetch(`${KIE_BASE}/veo/get-4k-video`, {
    method: "POST",
    headers,
    body: JSON.stringify({ taskId, index: 0 }),
  });
  const initJson = await initRes.json();
  console.log("[kie] 4K init response:", initJson);

  if (initJson.code !== 200) {
    throw new Error(extractError(initJson, "Failed to initiate 4K upgrade"));
  }

  // Poll using the same taskId via record-info
  const pollUrl = `${KIE_BASE}/veo/record-info?taskId=${taskId}`;
  const timeout = 600_000; // 10 min
  const interval = 30_000; // 30s
  const startTime = Date.now();

  const poll = async (): Promise<string> => {
    if (isCancelled?.()) throw new Error("Cancelled");
    if (Date.now() - startTime > timeout) throw new Error("4K upgrade timed out");

    const r = await fetch(pollUrl, { headers: { Authorization: `Bearer ${apiKey}` } });
    const j = await r.json();
    console.log("[kie] 4K poll:", j);

    const flag = j.data?.successFlag;
    if (flag === 1) {
      const url = j.data?.videoUrl || j.data?.resultUrl || j.data?.resultUrls?.[0] || "";
      if (!url && j.data?.resultJson) {
        const rj = typeof j.data.resultJson === "string" ? JSON.parse(j.data.resultJson) : j.data.resultJson;
        const parsed = rj?.videoUrl || rj?.resultUrls?.[0] || rj?.url || "";
        if (parsed) return parsed;
      }
      if (url) return url;
      throw new Error("4K result has no URL");
    }
    if (flag === 2 || flag === 3) {
      throw new Error(extractError(j.data, "4K upgrade failed"));
    }

    await new Promise((resolve) => setTimeout(resolve, interval));
    return poll();
  };

  return poll();
}

// ── Veo Extend (for Talking Head longer segments) ───────────────
export async function extendVeoVideo(params: {
  taskId: string;
  prompt: string;
  model?: "fast" | "quality";
  apiKey: string;
  isCancelled?: () => boolean;
}): Promise<VideoResult> {
  const { taskId, prompt, model = "quality", apiKey, isCancelled } = params;
  const headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };

  const veoModel = model === "fast" ? "veo3_fast" : "veo3";
  console.log(`[kie] Extending Veo video. taskId=${taskId}, model=${veoModel}`);

  const res = await fetch(`${KIE_BASE}/veo/extend`, {
    method: "POST",
    headers,
    body: JSON.stringify({ taskId, prompt, model: veoModel }),
  });

  const json = await res.json();
  console.log("[kie] Veo extend response:", json);

  const newTaskId = json.data?.taskId || json.taskId;
  if (!newTaskId) {
    throw new Error(extractError(json, "Failed to initiate Veo extend"));
  }

  const videoUrl = await pollTask(newTaskId, model === "fast" ? "veo_fast" : "veo_quality", apiKey, isCancelled);
  return { videoUrl, taskId: newTaskId };
}
