import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory rate limiter (resets on cold start, good enough for basic protection)
const attempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    if (req.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    const { code, email } = await req.json();

    if (!code || typeof code !== "string") {
      return json({ error: "Code is required" }, 400);
    }

    // Rate limit by email (if provided) or by code to prevent brute-force
    const rateLimitKey = email ? `email:${email.toLowerCase()}` : `code:${code}`;
    if (isRateLimited(rateLimitKey)) {
      return json({ error: "Too many attempts. Please try again later.", valid: false }, 429);
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await adminClient
      .from("invite_codes")
      .select("id, code, is_active, uses_remaining")
      .eq("code", code.trim().toUpperCase())
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return json({ valid: false, error: "Invalid invite code" });
    }

    // Check uses_remaining
    if (data.uses_remaining !== null && data.uses_remaining <= 0) {
      return json({ valid: false, error: "This invite code has been fully used" });
    }

    // Decrement uses_remaining if set
    if (data.uses_remaining !== null) {
      await adminClient
        .from("invite_codes")
        .update({ uses_remaining: data.uses_remaining - 1 })
        .eq("id", data.id);
    }

    return json({ valid: true });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
});
