import "server-only";

import Groq from "groq-sdk";

export const CLINIQ_MODELS = {
  // Primary model — high quality clinical synthesis
  INTERVIEW_FAST: "llama-3.3-70b-versatile",
  INSTANT_UTILITY: "llama-3.1-8b-instant",
  SPEECH_TO_TEXT: "whisper-large-v3-turbo",
  DOCUMENT_VISION: "llama-3.2-11b-vision-preview",
} as const;

// ── Dual-key lazy singletons ─────────────────────────────────────────────────
// GROQ_API_KEY   → primary key (required)
// GROQ_API_KEY_2 → secondary key (optional failover)
// If the primary key returns a 401/429/5xx, the client automatically retries
// once using the secondary key before throwing. Build never fails if keys are
// absent — they are resolved lazily on first request.

let _primary: Groq | null = null;
let _secondary: Groq | null = null;

function makeClient(key: string): Groq {
  return new Groq({ apiKey: key, timeout: 45_000, maxRetries: 1 });
}

function getPrimaryClient(): Groq {
  if (_primary) return _primary;

  // Support legacy GROK_API_KEY (typo) as a last resort
  const key =
    process.env.GROQ_API_KEY ||
    process.env.GROQ_API_KEY_2 ||
    process.env.GROK_API_KEY;

  if (!key) {
    throw new Error(
      "GROQ_API_KEY is not configured. Add it to Cloudflare Pages → Settings → Environment Variables."
    );
  }

  _primary = makeClient(key);
  return _primary;
}

function getSecondaryClient(): Groq | null {
  if (_secondary !== undefined && _secondary !== null) return _secondary;
  const key = process.env.GROQ_API_KEY_2;
  if (!key) {
    _secondary = null;
    return null;
  }
  _secondary = makeClient(key);
  return _secondary;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the primary Groq client.
 * Throws at runtime (not build time) if no key is configured.
 */
export function getGroqClient(): Groq {
  return getPrimaryClient();
}

/**
 * Wraps a Groq chat completion call with dual-key failover.
 * If the primary key fails (401, 429, 5xx), retries once with GROQ_API_KEY_2.
 * Falls back gracefully — callers never need to handle key rotation themselves.
 */
export async function groqChatWithFallback(
  params: Omit<Parameters<Groq["chat"]["completions"]["create"]>[0], "stream"> & { stream?: false }
): Promise<Groq.Chat.ChatCompletion> {
  // Try primary
  try {
    const client = getPrimaryClient();
    return await (client.chat.completions.create as any)(params);
  } catch (primaryErr) {
    const isRetryable =
      primaryErr instanceof Groq.APIError &&
      (primaryErr.status === 401 ||
        primaryErr.status === 429 ||
        (primaryErr.status >= 500 && primaryErr.status < 600));

    const secondary = getSecondaryClient();

    if (isRetryable && secondary) {
      console.warn(
        `[groq] Primary key failed (${(primaryErr as InstanceType<typeof Groq.APIError>).status}), switching to GROQ_API_KEY_2`
      );
      // Invalidate primary so next call re-checks env (key may rotate)
      _primary = null;
      return await (secondary.chat.completions.create as any)(params);
    }

    throw primaryErr;
  }
}

// ── Backward-compat shim ─────────────────────────────────────────────────────
// Existing callers that do `groqClient.chat.completions.create(...)` still work.
// New callers should prefer `groqChatWithFallback(...)` for automatic failover.
export const groqClient = {
  get chat() { return getGroqClient().chat; },
  get audio() { return getGroqClient().audio; },
} as unknown as Groq;
