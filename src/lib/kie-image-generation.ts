/**
 * Kie AI image generation client.
 * Same pattern as kie-video-generation.ts — create task, poll, return result.
 */

import type { ImageModel } from "./image-generation-engine";

const KIE_BASE = "https://api.kie.ai/api/v1";

// ── Types ───────────────────────────────────────────────────────
export interface CreateImageParams {
  model: ImageModel;
  prompt: string;
  imageInputs: string[]; // reference image URLs (character + product)
  resolution: "1K" | "2K" | "4K";
  aspectRatio: string;
  outputFormat?: "png" | "jpg";
  apiKey: string;
}

export interface ImageResult {
  imageUrl: string;
  taskId: string;
}

// ── Timeouts ────────────────────────────────────────────────────
const POLL_TIMEOUT: Record<ImageModel, number> = {
  "nano-banana": 120_000,
  "nano-banana-2": 180_000,
  "nano-banana-pro": 300_000,
};

const POLL_INTERVAL = 3_000;
const MAX_404_RETRIES = 5;

// ── Error helper ────────────────────────────────────────────────
function extractError(json: any, fallback: string): string {
  return json?.errorMessage || json?.msg || json?.message || json?.error || fallback;
}

// ── Create Task ─────────────────────────────────────────────────
async function createImageTask(params: CreateImageParams): Promise<string> {
  const {
    model,
    prompt,
    imageInputs,
    resolution,
    aspectRatio,
    outputFormat = "png",
    apiKey,
  } = params;

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  const body: Record<string, any> = {
    model,
    input: {
      prompt,
      image_input: imageInputs.length > 0 ? imageInputs.slice(0, 2) : undefined,
      aspect_ratio: aspectRatio,
      resolution,
      output_format: outputFormat,
    },
  };

  

  const res = await fetch(`${KIE_BASE}/jobs/createTask`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const json = await res.json();
  console.log("[kie-img] Create response:", json);

  if (json.code !== 200 || !json.data?.taskId) {
    throw new Error(extractError(json, "Failed to create image generation task"));
  }

  return json.data.taskId;
}

// ── Poll ────────────────────────────────────────────────────────
async function pollImageTask(
  taskId: string,
  model: ImageModel,
  apiKey: string,
  isCancelled?: () => boolean,
): Promise<string> {
  const pollUrl = `${KIE_BASE}/jobs/recordInfo?taskId=${taskId}`;
  const timeout = POLL_TIMEOUT[model] || 180_000;
  const startTime = Date.now();
  let consecutive404s = 0;

  const doPoll = async (): Promise<string> => {
    if (isCancelled?.()) throw new Error("Cancelled");
    if (Date.now() - startTime > timeout) {
      throw new Error(`Timeout — image generation took too long (${Math.round(timeout / 1000)}s)`);
    }

    const r = await fetch(pollUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (r.status === 404) {
      consecutive404s++;
      if (consecutive404s >= MAX_404_RETRIES) {
        throw new Error("Task not found after multiple retries");
      }
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
      return doPoll();
    }
    consecutive404s = 0;

    const j = await r.json();
    const state = j.data?.state;

    if (state === "success") {
      const resultJson =
        typeof j.data.resultJson === "string"
          ? JSON.parse(j.data.resultJson)
          : j.data.resultJson;
      const url =
        resultJson?.resultUrls?.[0] ||
        resultJson?.imageUrl ||
        resultJson?.image_url ||
        resultJson?.url ||
        "";
      if (!url) throw new Error("No image URL in result");
      return url;
    }

    if (state === "fail") {
      throw new Error(extractError(j.data, "Image generation failed"));
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
    return doPoll();
  };

  return doPoll();
}

// ── Public API ──────────────────────────────────────────────────
export async function generateImageAndWait(
  params: CreateImageParams,
  isCancelled?: () => boolean,
): Promise<ImageResult> {
  const taskId = await createImageTask(params);
  const imageUrl = await pollImageTask(taskId, params.model, params.apiKey, isCancelled);
  return { imageUrl, taskId };
}
