/**
 * Unified LLM fetch — Kie AI (primary) → Google AI Studio → OpenRouter (fallbacks).
 *
 * All callers still use the same Gemini-format body & response.
 * Internally this adapter converts to OpenAI chat format for Kie AI / OpenRouter,
 * and passes through natively for Google direct.
 *
 * Fallback keys are injected via setLLMFallbackKeys() from useApiKeys.
 */

const DEFAULT_TIMEOUT_MS = 60_000;

// ── Kie AI chat endpoint (same base as image gen) ───────
const KIE_CHAT_URL = "https://api.kie.ai/api/v1/chat/completions";

// ── Fallback key store (set from useApiKeys) ────────────
interface FallbackKeys {
  google?: string;
  openrouter?: string;
}
let _fallbackKeys: FallbackKeys = {};

/** Call from useApiKeys whenever keys change. */
export function setLLMFallbackKeys(keys: FallbackKeys) {
  _fallbackKeys = { ...keys };
}

// ── Model mapping for OpenRouter ────────────────────────
const OPENROUTER_MODEL_MAP: Record<string, string> = {
  "gemini-2.5-flash": "google/gemini-2.5-flash",
  "gemini-3.1-pro-preview": "google/gemini-3.1-pro-preview",
  "gemini-2.5-pro": "google/gemini-2.5-pro",
};

// ── Format converters ───────────────────────────────────

/** Gemini request body → OpenAI chat completion body */
function geminiBodyToOpenAI(model: string, body: Record<string, any>): Record<string, any> {
  const contents: any[] = body.contents || [];
  const messages: any[] = [];

  for (const content of contents) {
    const parts: any[] = content.parts || [];
    const role = content.role === "model" ? "assistant" : "user";
    const hasImages = parts.some((p: any) => p.inline_data);

    if (hasImages) {
      // Multimodal message (text + images)
      const multiParts: any[] = [];
      for (const part of parts) {
        if (part.text) {
          multiParts.push({ type: "text", text: part.text });
        }
        if (part.inline_data) {
          multiParts.push({
            type: "image_url",
            image_url: {
              url: `data:${part.inline_data.mime_type};base64,${part.inline_data.data}`,
            },
          });
        }
      }
      messages.push({ role, content: multiParts });
    } else {
      // Text-only message
      const text = parts.map((p: any) => p.text || "").join("");
      messages.push({ role, content: text });
    }
  }

  const result: Record<string, any> = { model, messages };

  // Map generationConfig → OpenAI params
  const gc = body.generationConfig;
  if (gc) {
    if (gc.temperature !== undefined) result.temperature = gc.temperature;
    if (gc.maxOutputTokens) result.max_tokens = gc.maxOutputTokens;
    if (gc.responseMimeType === "application/json") {
      result.response_format = { type: "json_object" };
    }
  }

  return result;
}

/** OpenAI chat completion response → Gemini response shape */
function openAIResponseToGemini(json: any): any {
  const text = json.choices?.[0]?.message?.content || "";
  return {
    candidates: [
      {
        content: {
          parts: [{ text }],
          role: "model",
        },
      },
    ],
  };
}

// ── Provider-specific fetch functions ───────────────────

async function fetchViaKieAI(
  model: string,
  apiKey: string,
  body: Record<string, any>,
  signal: AbortSignal,
): Promise<any> {
  const openAIBody = geminiBodyToOpenAI(model, body);

  const res = await fetch(KIE_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(openAIBody),
    signal,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Kie AI error ${res.status}: ${errorText.slice(0, 200)}`);
  }

  return openAIResponseToGemini(await res.json());
}

async function fetchViaGoogle(
  model: string,
  apiKey: string,
  body: Record<string, any>,
  signal: AbortSignal,
): Promise<any> {
  // Native Gemini format — no conversion needed
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    },
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google AI Studio error ${res.status}: ${errorText.slice(0, 200)}`);
  }

  return await res.json();
}

async function fetchViaOpenRouter(
  model: string,
  apiKey: string,
  body: Record<string, any>,
  signal: AbortSignal,
): Promise<any> {
  const orModel = OPENROUTER_MODEL_MAP[model] || `google/${model}`;
  const openAIBody = geminiBodyToOpenAI(orModel, body);

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(openAIBody),
    signal,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${errorText.slice(0, 200)}`);
  }

  return openAIResponseToGemini(await res.json());
}

// ── Public API (unchanged signature) ────────────────────

/**
 * Drop-in replacement for the old geminiFetch.
 * Same signature, same response shape — callers don't change.
 *
 * Priority: Kie AI → Google AI Studio (if key set) → OpenRouter (if key set)
 */
export async function geminiFetch(
  model: string,
  apiKey: string,
  body: Record<string, any>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Build provider chain: primary + available fallbacks
  const providers: Array<{ name: string; fn: () => Promise<any> }> = [
    { name: "Kie AI", fn: () => fetchViaKieAI(model, apiKey, body, controller.signal) },
  ];

  if (_fallbackKeys.google) {
    providers.push({
      name: "Google AI Studio",
      fn: () => fetchViaGoogle(model, _fallbackKeys.google!, body, controller.signal),
    });
  }

  if (_fallbackKeys.openrouter) {
    providers.push({
      name: "OpenRouter",
      fn: () => fetchViaOpenRouter(model, _fallbackKeys.openrouter!, body, controller.signal),
    });
  }

  let lastError: Error | null = null;

  try {
    for (const provider of providers) {
      try {
        const result = await provider.fn();
        clearTimeout(timeoutId);
        if (providers.indexOf(provider) > 0) {
          console.info(`[geminiFetch] Succeeded via fallback: ${provider.name}`);
        }
        return result;
      } catch (err: any) {
        console.warn(`[geminiFetch] ${provider.name} failed:`, err.message);
        lastError = err;
      }
    }

    clearTimeout(timeoutId);
    throw lastError || new Error("Semua provider LLM gagal. Cek API key kamu.");
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("LLM request timed out (60s). Coba lagi atau ganti model ke Flash.");
    }
    throw err;
  }
}
