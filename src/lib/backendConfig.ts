export function validateBackendConfig(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

  if (!url || !key) {
    console.error("[GENBOX] ❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY");
    return false;
  }

  try {
    const host = new URL(url).hostname;
    const urlRef = host.split(".")[0];
    const keySnippet = `${key.slice(0, 8)}...${key.slice(-4)}`;

    console.info("[GENBOX] Backend config:", {
      origin: window.location.origin,
      host,
      keyFingerprint: keySnippet,
      projectId: projectId || "(not set)",
    });

    if (projectId && urlRef !== projectId) {
      console.warn(
        `[GENBOX] ⚠️ Project ID mismatch: URL ref="${urlRef}" vs VITE_SUPABASE_PROJECT_ID="${projectId}"`
      );
    }
  } catch {
    console.error("[GENBOX] ❌ Invalid VITE_SUPABASE_URL format:", url);
    return false;
  }

  return true;
}
