/**
 * Shared Gemini API fetch wrapper with 30-second timeout.
 * Use this instead of raw fetch() for all Gemini calls.
 */

const GEMINI_TIMEOUT_MS = 30_000;

export async function geminiFetch(
  model: string,
  apiKey: string,
  body: Record<string, any>,
  timeoutMs: number = GEMINI_TIMEOUT_MS,
): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Gemini API error ${res.status}: ${errorText.slice(0, 200)}`);
    }

    return await res.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("Gemini request timed out (30s). Coba lagi atau ganti model ke Flash.");
    }
    throw err;
  }
}
