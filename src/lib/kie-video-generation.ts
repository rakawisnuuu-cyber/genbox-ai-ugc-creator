/**
 * Shared Kie AI video generation client.
 * Single source of truth for task creation, polling, and result parsing.
 * Used by both quick-mode (VideoPage) and multi-shot (useMultiShotGeneration).
 */

const KIE_BASE = "https://api.kie.ai/api/v1";

// ── Duration normalization ──────────────────────────────────────────
export function normalizeDurationForModel(model: string, duration: number): number {
  if (model === "grok") {
    // Grok only accepts 6 or 10
    return duration < 8 ? 6 : 10;
  }
  return duration;
}

// ── Types ───────────────────────────────────────────────────────────
export interface CreateVideoParams {
  model: "grok" | "veo_fast" | "veo_quality";
  prompt: string;
  imageUrls: string[];
  duration?: number;       // seconds – will be normalized for Grok
  aspectRatio?: string;
  apiKey: string;
}

export interface VideoResult {
  videoUrl: string;
}

// ── Timeouts & retry config ─────────────────────────────────────────
const POLL_TIMEOUT: Record<string, number> = {
  grok: 180_000,       // 3 min
  veo_fast: 300_000,   // 5 min
  veo_quality: 600_000, // 10 min
};

const POLL_INTERVAL: Record<string, number> = {
  grok: 3_000,
  veo_fast: 5_000,
  veo_quality: 5_000,
};

const MAX_404_RETRIES = 5;

// ── Error helper ────────────────────────────────────────────────────
function extractError(json: any, fallback: string): string {
  return json?.msg || json?.message || json?.error || fallback;
}

// ── Task creation ───────────────────────────────────────────────────
async function createTask(params: CreateVideoParams): Promise<{ taskId: string; model: string }> {
  const { model, prompt, imageUrls, duration = 6, aspectRatio = "9:16", apiKey } = params;
  const headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };

  if (model === "grok") {
    const normalizedDuration = normalizeDurationForModel("grok", duration);
    console.log(`[kie] Creating Grok task. Duration ${duration}→${normalizedDuration}`);

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
    console.log("[kie] Grok create response:", json);

    if (json.code !== 200 || !json.data?.taskId) {
      throw new Error(extractError(json, "Failed to create Grok task"));
    }
    return { taskId: json.data.taskId, model };
  }

  // Veo Fast / Quality
  const veoModel = model === "veo_fast" ? "veo3_fast" : "veo3";
  console.log(`[kie] Creating Veo task. Model: ${veoModel}`);

  const res = await fetch(`${KIE_BASE}/veo/generate`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      prompt,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      model: veoModel,
      aspect_ratio: aspectRatio,
      generationType: "FIRST_AND_LAST_FRAMES_2_VIDEO",
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
async function pollTask(
  taskId: string,
  model: string,
  apiKey: string,
  isCancelled?: () => boolean,
): Promise<string> {
  const pollUrl =
    model === "grok"
      ? `${KIE_BASE}/jobs/recordInfo?taskId=${taskId}`
      : `${KIE_BASE}/veo/record-info?taskId=${taskId}`;

  const timeout = POLL_TIMEOUT[model] || 300_000;
  const interval = POLL_INTERVAL[model] || 5_000;
  const startTime = Date.now();
  let consecutive404s = 0;

  console.log(`[kie] Polling started. Model=${model}, taskId=${taskId}, url=${pollUrl}`);

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

    if (model === "grok") {
      const state = j.data?.state;
      if (state === "success") {
        const resultJson =
          typeof j.data.resultJson === "string"
            ? JSON.parse(j.data.resultJson)
            : j.data.resultJson;
        const url =
          resultJson?.resultUrls?.[0] ||
          resultJson?.videoUrl ||
          resultJson?.video_url ||
          resultJson?.url ||
          "";
        if (!url) throw new Error("No video URL in Grok result");
        return url;
      }
      if (state === "fail") throw new Error(extractError(j.data, "Grok generation failed"));
    } else {
      const flag = j.data?.successFlag;
      if (flag === 1) {
        // Try multiple known fields for the video URL
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

        // Check inside resultJson if present
        if (!url && j.data?.resultJson) {
          const rj = typeof j.data.resultJson === "string" ? JSON.parse(j.data.resultJson) : j.data.resultJson;
          url = rj?.videoUrl || rj?.resultUrls?.[0] || rj?.video_url || rj?.url || "";
        }

        // Check inside output if present
        if (!url && j.data?.output) {
          const out = typeof j.data.output === "string" ? JSON.parse(j.data.output) : j.data.output;
          url = out?.videoUrl || out?.video_url || out?.url || out?.resultUrls?.[0] || "";
        }

        console.log("[kie] Veo success. Extracted URL:", url, "Full data:", JSON.stringify(j.data));
        if (!url) throw new Error("No video URL in Veo result. Raw: " + JSON.stringify(j.data).slice(0, 300));
        return url;
      }
      if (flag === 3) throw new Error(extractError(j.data, "Veo generation failed"));
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
  return { videoUrl };
}
